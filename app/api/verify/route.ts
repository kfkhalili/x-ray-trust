import { NextRequest, NextResponse } from "next/server";
import { calculateTrust } from "@/lib/trust-engine";
import type { XRawData, TrustReport } from "@/types/trust";
import { Result, ok, err } from "neverthrow";
import { isUsernameRequest } from "@/lib/validation";

// Mark route as dynamic to prevent build-time analysis
export const dynamic = "force-dynamic";

/**
 * Cache freshness window (24 hours). X account metadata changes slowly, so a
 * daily refresh balances freshness against provider cost.
 */
const CACHE_FRESHNESS_MS = 24 * 60 * 60 * 1000;

/** Per-IP rate limit: stops one visitor from draining the paid upstream. */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10; // lookups per IP per hour

/**
 * Global monthly cap on PAID upstream calls, to guard against overage on the
 * RapidAPI plan (default plan is 1000/month; we stop at 950 for headroom).
 *
 * ⚠️ Best-effort only: like the cache below, this counter lives in process
 * memory, so on serverless it resets on cold start and is per-instance. It is
 * NOT a hard guarantee across a fleet — also set a hard request limit (no
 * overage) in the RapidAPI dashboard for real billing protection.
 */
const MONTHLY_BUDGET = Number(process.env.RAPIDAPI_MONTHLY_BUDGET ?? 950);

/**
 * Data provider: RapidAPI. Defaults to the `twitter241` API (davethebeast),
 * which proxies X's GraphQL "UserByScreenName" response. Override the host via
 * RAPIDAPI_HOST if you subscribe to a different RapidAPI X endpoint.
 */
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? "twitter241.p.rapidapi.com";

type ErrorResponse = { error: string; code: string };

/**
 * Normalizes a username for consistent cache keys: strips a leading @ and
 * lowercases. ("@Jack", "Jack", "JACK" → "jack".)
 */
const normalizeUsername = (username: string): string =>
  username.trim().replace(/^@+/, "").toLowerCase();

// ---------------------------------------------------------------------------
// In-memory 24h cache (no database).
//
// NOTE: This lives in process memory, so it resets on restart and is per
// serverless instance in production. That's fine for an MVP; swap to Vercel KV
// / Upstash Redis if you want a durable, shared cache.
// ---------------------------------------------------------------------------
type CacheEntry = { report: TrustReport; expires: number };
const cache = new Map<string, CacheEntry>();

const getCached = (key: string): TrustReport | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.report;
};

const setCached = (key: string, report: TrustReport): void => {
  cache.set(key, { report, expires: Date.now() + CACHE_FRESHNESS_MS });
};

// ---------------------------------------------------------------------------
// In-memory per-IP rate limit (no database, no accounts).
// ---------------------------------------------------------------------------
const hitsByIp = new Map<string, number[]>();

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
};

/** Records a lookup and returns false if the IP is over its hourly limit. */
const withinRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
};

// ---------------------------------------------------------------------------
// Global monthly budget: caps how many PAID upstream calls we make per month
// so we never blow past the RapidAPI plan quota. (Best-effort in memory — see
// the note on MONTHLY_BUDGET.)
// ---------------------------------------------------------------------------
let budgetMonth = "";
let budgetUsed = 0;

const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
};

/** Remaining paid calls this month (auto-resets when the UTC month rolls over). */
const budgetRemaining = (): number => {
  const key = currentMonthKey();
  if (key !== budgetMonth) {
    budgetMonth = key;
    budgetUsed = 0;
  }
  return Math.max(0, MONTHLY_BUDGET - budgetUsed);
};

/** Records one paid upstream call against the monthly budget. */
const recordUpstreamCall = (): void => {
  budgetRemaining(); // ensure the month window is current before incrementing
  budgetUsed += 1;
};

// ---------------------------------------------------------------------------
// Provider adapter.
//
// Returns Result<XRawData, Error> where the Error message is one of the codes
// the POST handler maps to a response: CONFIG_ERROR | ACCOUNT_NOT_FOUND |
// RATE_LIMIT_EXCEEDED | UPSTREAM_ERROR. This is the ONLY place tied to a data
// provider — swap this function to change providers.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type ExtractedUser = {
  restId?: string;
  isBlueVerified?: boolean;
  createdAt?: string;
  name?: string;
  screenName?: string;
  profilePicture?: string;
  description?: string;
  isProtected?: boolean;
  followersCount?: number;
  friendsCount?: number;
  listedCount?: number;
  statusesCount?: number;
  mediaCount?: number;
  favouritesCount?: number;
};

/**
 * Extracts an X user from a RapidAPI response.
 *
 * Built for twitter241's current schema, where the fields are split across
 * `core` (created_at, name, screen_name), `legacy` (follower/status counts,
 * description), `privacy` (protected) and `verification`, with the avatar under
 * `avatar.image_url`. Falls back to the older all-in-`legacy` shape so a schema
 * or provider change is less likely to break it.
 */
const extractUser = (json: any): ExtractedUser | null => {
  const r =
    json?.result?.data?.user?.result ??
    json?.data?.user?.result ??
    json?.user?.result ??
    json?.result ??
    json;
  if (!r || typeof r !== "object") return null;

  const legacy = r.legacy ?? {};
  const core = r.core ?? {};

  const screenName = core.screen_name ?? legacy.screen_name ?? r.screen_name;
  const followersCount = legacy.followers_count ?? r.followers_count;

  // Need at least a handle or a follower count to treat this as a real account.
  if (!screenName && followersCount === undefined) return null;

  return {
    restId: r.rest_id ?? legacy.id_str ?? r.id_str,
    isBlueVerified:
      r.is_blue_verified ?? r.verification?.verified ?? legacy.verified,
    createdAt: core.created_at ?? legacy.created_at,
    name: core.name ?? legacy.name ?? screenName,
    screenName,
    profilePicture: r.avatar?.image_url ?? legacy.profile_image_url_https,
    description: legacy.description ?? r.description,
    isProtected: r.privacy?.protected ?? legacy.protected,
    followersCount,
    friendsCount: legacy.friends_count ?? r.friends_count,
    listedCount: legacy.listed_count,
    statusesCount: legacy.statuses_count,
    mediaCount: legacy.media_count,
    favouritesCount: legacy.favourites_count,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const fetchXAccountData = async (
  username: string
): Promise<Result<XRawData, Error>> => {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error("RAPIDAPI_KEY is not configured");
    return err(new Error("CONFIG_ERROR"));
  }

  let response: Response;
  try {
    response = await fetch(
      `https://${RAPIDAPI_HOST}/user?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );
  } catch (error) {
    console.error("RapidAPI fetch error:", error);
    // Network / DNS / timeout — no HTTP round-trip, so no quota was spent.
    return err(new Error("UPSTREAM_ERROR"));
  }

  // An HTTP response came back → this request counted against the plan quota.
  recordUpstreamCall();

  const responseText = await response.text();

  if (!response.ok) {
    console.error("RapidAPI error:", response.status, responseText.slice(0, 300));
    if (response.status === 404) return err(new Error("ACCOUNT_NOT_FOUND"));
    if (response.status === 429) return err(new Error("RATE_LIMIT_EXCEEDED"));
    // 401/403 (bad key), 5xx, etc. are our/upstream problem, not a missing account.
    return err(new Error("UPSTREAM_ERROR"));
  }

  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch {
    console.error("Failed to parse RapidAPI response:", responseText.slice(0, 300));
    return err(new Error("UPSTREAM_ERROR"));
  }

  const user = extractUser(json);
  if (!user?.screenName) {
    // No user object / unavailable / suspended → genuinely not found.
    return err(new Error("ACCOUNT_NOT_FOUND"));
  }

  const id = user.restId ?? "";
  const createdAt = user.createdAt ?? "";
  const blueVerified = Boolean(user.isBlueVerified ?? false);

  const data: XRawData = {
    id,
    created_at: createdAt,
    blue_verified: blueVerified,
    followers_count: user.followersCount,
    friends_count: user.friendsCount,
    listed_count: user.listedCount,
    statuses_count: user.statusesCount,
    media_count: user.mediaCount,
    favourites_count: user.favouritesCount,
    protected: user.isProtected,
    _userInfo: {
      id,
      username: user.screenName,
      name: user.name ?? user.screenName,
      profilePicture: user.profilePicture,
      followersCount: user.followersCount,
      followingCount: user.friendsCount,
      createdAt,
      blueVerified,
      description: user.description,
    },
  };

  return ok(data);
};

/**
 * POST /api/verify — fetch (or serve cached) trust report for an X handle.
 *
 * Flow: validate → serve fresh cache if present → rate-limit the IP → fetch from
 * provider → score → cache → return. No auth, no credits, no database.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "Invalid JSON in request body", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (!isUsernameRequest(body)) {
    return NextResponse.json<ErrorResponse>(
      { error: "Username is required and must be a string", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const normalizedUsername = normalizeUsername(body.username);

  // Fresh cache hit → return immediately (no rate-limit consumption, no API call).
  const cached = getCached(normalizedUsername);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  // Cache miss → this will hit the paid upstream, so enforce the IP rate limit.
  const clientIp = getClientIp(request);
  if (!withinRateLimit(clientIp)) {
    return NextResponse.json<ErrorResponse>(
      {
        error: "Too many lookups from this IP. Please wait a bit and try again.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429 }
    );
  }

  // Global monthly budget guard → never exceed the paid plan's quota.
  if (budgetRemaining() <= 0) {
    console.warn("Monthly RapidAPI budget reached; refusing new upstream calls.");
    return NextResponse.json<ErrorResponse>(
      {
        error:
          "This service has reached its monthly capacity. Please try again later.",
        code: "SERVICE_AT_CAPACITY",
      },
      { status: 503 }
    );
  }

  const accountDataResult = await fetchXAccountData(normalizedUsername);

  if (accountDataResult.isErr()) {
    const errorMessage = accountDataResult.error.message;
    console.error("Failed to fetch account data:", errorMessage);

    if (errorMessage === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json<ErrorResponse>(
        { error: "Rate limit exceeded. Please wait a moment and try again.", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 }
      );
    }
    if (errorMessage === "CONFIG_ERROR") {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Verification is temporarily unavailable due to a server configuration issue. Please try again later.",
          code: "SERVER_ERROR",
        },
        { status: 503 }
      );
    }
    if (errorMessage === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json<ErrorResponse>(
        { error: "Account not found. Please check the username and try again.", code: "ACCOUNT_NOT_FOUND" },
        { status: 404 }
      );
    }
    // UPSTREAM_ERROR and anything else.
    return NextResponse.json<ErrorResponse>(
      {
        error: "The X verification service is temporarily unavailable. Please try again in a moment.",
        code: "UPSTREAM_ERROR",
      },
      { status: 502 }
    );
  }

  const trustReport = calculateTrust(accountDataResult.value);
  setCached(normalizedUsername, trustReport);

  return NextResponse.json({ ...trustReport, cached: false });
}
