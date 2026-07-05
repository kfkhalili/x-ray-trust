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

/** Per-IP rate limit: protects the (paid) upstream from being drained. */
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20; // lookups per IP per window

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
// Provider adapter.
//
// Returns Result<XRawData, Error> where the Error message is one of the codes
// the POST handler maps to a response: CONFIG_ERROR | ACCOUNT_NOT_FOUND |
// RATE_LIMIT_EXCEEDED | UPSTREAM_ERROR. This is the ONLY place tied to a data
// provider — swap this function to change providers.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type LegacyUser = Record<string, any>;
type ExtractedUser = {
  restId?: string;
  isBlueVerified?: boolean;
  legacy?: LegacyUser;
};

/**
 * Locates the X user object inside a RapidAPI response. Defensive against the
 * common nesting variants so a small shape difference between RapidAPI X APIs
 * doesn't break the mapping. The canonical `twitter241` path is
 * `result.data.user.result.{rest_id,is_blue_verified,legacy}`.
 *
 * ⚠️ Verify against a live response once RAPIDAPI_KEY is set (see README notes).
 */
const extractUser = (json: any): ExtractedUser | null => {
  const candidates = [
    json?.result?.data?.user?.result,
    json?.data?.user?.result,
    json?.user?.result,
    json?.result,
    json,
  ];
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;
    // Standard X-GraphQL shape: fields live under `legacy`.
    if (c.legacy && (c.legacy.screen_name || c.legacy.followers_count !== undefined)) {
      return {
        restId: c.rest_id ?? c.legacy.id_str,
        isBlueVerified: c.is_blue_verified ?? c.legacy.verified,
        legacy: c.legacy,
      };
    }
    // Flatter shape: fields at the top level.
    if (c.screen_name || c.followers_count !== undefined) {
      return {
        restId: c.rest_id ?? c.id_str ?? c.id,
        isBlueVerified: c.is_blue_verified ?? c.verified,
        legacy: c,
      };
    }
  }
  return null;
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

  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/user?username=${encodeURIComponent(username)}`,
      {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );

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
    if (!user?.legacy?.screen_name) {
      // No user object / unavailable / suspended → genuinely not found.
      return err(new Error("ACCOUNT_NOT_FOUND"));
    }

    const legacy = user.legacy;
    const id = user.restId ?? legacy.id_str ?? "";
    const createdAt = legacy.created_at ?? "";
    const blueVerified = Boolean(user.isBlueVerified ?? legacy.verified ?? false);

    const data: XRawData = {
      id,
      created_at: createdAt,
      blue_verified: blueVerified,
      followers_count: legacy.followers_count,
      friends_count: legacy.friends_count,
      listed_count: legacy.listed_count,
      statuses_count: legacy.statuses_count,
      media_count: legacy.media_count,
      favourites_count: legacy.favourites_count,
      protected: legacy.protected,
      _userInfo: {
        id,
        username: legacy.screen_name,
        name: legacy.name ?? legacy.screen_name,
        profilePicture: legacy.profile_image_url_https,
        followersCount: legacy.followers_count,
        followingCount: legacy.friends_count,
        createdAt,
        blueVerified,
        description: legacy.description,
      },
    };

    return ok(data);
  } catch (error) {
    console.error("RapidAPI fetch error:", error);
    // Network / DNS / timeout — transient, not a missing account.
    return err(new Error("UPSTREAM_ERROR"));
  }
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
