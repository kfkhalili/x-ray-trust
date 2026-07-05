import { NextRequest, NextResponse } from "next/server";
import { isUsernameRequest } from "@/lib/validation";
import { createTwitter241Provider } from "@/lib/x-provider";
import {
  createMemoryCache,
  createMemoryRateLimiter,
  createMonthlyBudget,
} from "@/lib/stores";
import {
  verifyHandle,
  type LookupDeps,
  type LookupOutcome,
} from "@/lib/verify-handle";

// Mark route as dynamic to prevent build-time analysis.
export const dynamic = "force-dynamic";

// Throttling knobs. See lib/verify-handle.ts (policy) and lib/stores.ts (state).
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — X metadata changes slowly.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h.
const RATE_LIMIT_MAX = 10; // lookups per IP per hour.

/**
 * Monthly cap on PAID upstream calls (default plan is 1000/month; stop at 950
 * for headroom). Best-effort in memory — set a hard request limit in the
 * RapidAPI dashboard for the real billing guarantee.
 */
const MONTHLY_BUDGET = Number(process.env.RAPIDAPI_MONTHLY_BUDGET ?? 950);

// Module-level singletons so the cache / limiter / budget persist across
// requests within a process.
const deps: LookupDeps = {
  provider: createTwitter241Provider(),
  cache: createMemoryCache(CACHE_TTL_MS),
  rateLimiter: createMemoryRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX),
  budget: createMonthlyBudget(MONTHLY_BUDGET),
};

type ErrorResponse = { error: string; code: string };

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
};

/** Maps a domain lookup outcome to its HTTP response. */
const toResponse = (outcome: LookupOutcome): NextResponse => {
  switch (outcome.status) {
    case "ok":
      return NextResponse.json({ ...outcome.report, cached: outcome.cached });
    case "not_found":
      return NextResponse.json<ErrorResponse>(
        {
          error: "Account not found. Please check the username and try again.",
          code: "ACCOUNT_NOT_FOUND",
        },
        { status: 404 }
      );
    case "rate_limited":
      return NextResponse.json<ErrorResponse>(
        {
          error: "Too many lookups right now. Please wait a moment and try again.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    case "at_capacity":
      return NextResponse.json<ErrorResponse>(
        {
          error:
            "This service has reached its monthly capacity. Please try again later.",
          code: "SERVICE_AT_CAPACITY",
        },
        { status: 503 }
      );
    case "config_error":
      return NextResponse.json<ErrorResponse>(
        {
          error:
            "Verification is temporarily unavailable due to a server configuration issue. Please try again later.",
          code: "SERVER_ERROR",
        },
        { status: 503 }
      );
    case "upstream_error":
      return NextResponse.json<ErrorResponse>(
        {
          error:
            "The X verification service is temporarily unavailable. Please try again in a moment.",
          code: "UPSTREAM_ERROR",
        },
        { status: 502 }
      );
  }
};

/**
 * POST /api/verify — thin HTTP adapter over the lookup policy. Parses the body,
 * delegates to verifyHandle, and maps the outcome to a response.
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

  const outcome = await verifyHandle(body.username, getClientIp(request), deps);
  return toResponse(outcome);
}
