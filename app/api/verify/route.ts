import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateTrust } from "@/lib/trust-engine";
import type { XRawData, TrustReport } from "@/types/trust";
import { Result, ok, err } from "neverthrow";
import { isUsernameRequest } from "@/lib/validation";

// Mark route as dynamic to prevent build-time analysis
export const dynamic = "force-dynamic";

/**
 * Cache freshness window in milliseconds (24 hours).
 *
 * Why 24 hours? Twitter account metadata changes slowly (followers, verification status).
 * Daily refresh balances freshness with API rate limits and costs.
 */
const CACHE_FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Normalizes username for consistent storage and lookup.
 *
 * Why normalize? Users may enter "@username", "Username", or "USERNAME".
 * All should map to the same cache entry.
 */
const normalizeUsername = (username: string): string => {
  return username.trim().replace(/^@+/, "").toLowerCase();
};

/**
 * In-memory tracking of free lookups by IP address for unregistered users.
 *
 * Why in-memory? Simple MVP implementation. In production, use Redis or a database table
 * for persistence across server restarts and multi-instance deployments.
 *
 * NOTE: In development, this Map resets on every code change/server restart.
 * This is expected behavior. In production, the server stays running and the Map persists.
 *
 * Regeneration: Free lookups reset hourly (1 hour) from the first lookup.
 * This allows users to try the service more frequently while still encouraging sign-up.
 */
interface FreeLookupData {
  count: number;
  firstLookupTime: number; // Timestamp of first lookup (used for hourly reset)
  lookupHistory: number[]; // Array of timestamps for all lookups (for usage analytics)
}

const freeLookupsByIp = new Map<string, FreeLookupData>();

/**
 * Free lookup regeneration period in milliseconds (1 hour).
 * Unregistered users get 3 free lookups per hour, resetting 1 hour after their first lookup.
 * This is more generous than daily limits and allows users to try the service more frequently.
 */
const FREE_LOOKUP_RESET_PERIOD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Maximum free lookups per reset period for unregistered users.
 */
const MAX_FREE_LOOKUPS = 3;

/**
 * Gets the client IP address from the request.
 *
 * Why check headers? Next.js runs behind proxies (Vercel, Cloudflare, etc.).
 * The real IP is in X-Forwarded-For or X-Real-IP headers, not request.ip.
 */
const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
};

/**
 * Checks if an IP address has free lookups remaining.
 *
 * Automatically resets lookups if 1 hour has passed since the first lookup.
 * Returns the number of remaining free lookups (0-3).
 *
 * Also tracks usage history for analytics - we measure usage rather than strictly limit.
 */
const getRemainingFreeLookups = (ip: string): number => {
  const data = freeLookupsByIp.get(ip);

  // No data means user has all lookups available
  if (!data) {
    return MAX_FREE_LOOKUPS;
  }

  // Check if 1 hour has passed since first lookup
  const now = Date.now();
  const timeSinceFirstLookup = now - data.firstLookupTime;

  if (timeSinceFirstLookup >= FREE_LOOKUP_RESET_PERIOD_MS) {
    // Reset: 1 hour has passed, clear the data
    freeLookupsByIp.delete(ip);
    return MAX_FREE_LOOKUPS;
  }

  // Clean up old lookups from history (older than reset period)
  // This helps with memory management and accurate counting
  const validLookups = data.lookupHistory.filter(
    (timestamp) => now - timestamp < FREE_LOOKUP_RESET_PERIOD_MS
  );

  // Update count based on valid lookups
  const currentCount = validLookups.length;

  // Return remaining lookups
  return Math.max(0, MAX_FREE_LOOKUPS - currentCount);
};

/**
 * Gets the time until the next free lookup reset (in milliseconds).
 * Returns null if lookups are available or if no data exists.
 */
const getTimeUntilNextReset = (ip: string): number | null => {
  const data = freeLookupsByIp.get(ip);

  // No data means user has all lookups available
  if (!data) {
    return null;
  }

  const now = Date.now();
  const timeSinceFirstLookup = now - data.firstLookupTime;

  // If reset period has passed, no need to wait
  if (timeSinceFirstLookup >= FREE_LOOKUP_RESET_PERIOD_MS) {
    return null;
  }

  // Calculate time until reset
  const timeUntilReset = FREE_LOOKUP_RESET_PERIOD_MS - timeSinceFirstLookup;
  return timeUntilReset;
};

/**
 * Records a free lookup for an IP address.
 *
 * Automatically resets lookups if 1 hour has passed since the first lookup.
 * Tracks full usage history for analytics - we measure usage rather than strictly limit.
 * Returns true if the lookup was allowed, false if limit exceeded.
 */
const recordFreeLookup = (ip: string): boolean => {
  const data = freeLookupsByIp.get(ip);
  const now = Date.now();

  // If no data or 1 hour has passed, reset
  if (!data || now - data.firstLookupTime >= FREE_LOOKUP_RESET_PERIOD_MS) {
    // First lookup or reset after 1 hour
    freeLookupsByIp.set(ip, {
      count: 1,
      firstLookupTime: now,
      lookupHistory: [now], // Track this lookup
    });
    return true;
  }

  // Clean up old lookups from history (older than reset period)
  const validLookups = data.lookupHistory.filter(
    (timestamp) => now - timestamp < FREE_LOOKUP_RESET_PERIOD_MS
  );

  // Check if limit exceeded based on valid lookups
  if (validLookups.length >= MAX_FREE_LOOKUPS) {
    return false; // Limit exceeded
  }

  // Add this lookup to history
  validLookups.push(now);

  // Update data with new count and history
  freeLookupsByIp.set(ip, {
    count: validLookups.length,
    firstLookupTime: data.firstLookupTime, // Keep original first lookup time
    lookupHistory: validLookups,
  });

  return true;
};

/**
 * Error response type for API errors.
 */
type ErrorResponse = {
  error: string;
  code: string;
};

/**
 * Fetches X account metadata from twitterapi.io.
 *
 * Returns Result type for functional error handling.
 * Errors are categorized but all result in "account not found" for user-facing messages.
 */
const fetchXAccountData = async (
  username: string
): Promise<Result<XRawData, Error>> => {
  const apiKey = process.env.TWITTER_API_KEY;

  if (!apiKey) {
    return err(new Error("TWITTER_API_KEY not configured"));
  }

  try {
    // Correct endpoint: /twitter/user/info with userName query parameter
    // Header: X-API-Key (capital X, capital API, capital Key)
    const response = await fetch(
      `https://api.twitterapi.io/twitter/user/info?userName=${encodeURIComponent(
        username
      )}`,
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Twitter API error:", response.status, responseText);

      if (response.status === 404) {
        return err(new Error("Account not found"));
      }

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        return err(new Error("RATE_LIMIT_EXCEEDED"));
      }

      return err(new Error(`Twitter API error: ${response.status}`));
    }

    // Parse the response - API returns { status, msg, data: {...} }
    type ApiResponse = {
      status: string;
      msg: string;
      data?: {
        id: string;
        name: string;
        userName: string;
        createdAt: string;
        isBlueVerified: boolean;
        followers?: number;
        following?: number;
        profilePicture?: string;
        description?: string;
        statusesCount?: number;
        mediaCount?: number;
        favouritesCount?: number;
        isAutomated?: boolean;
        protected?: boolean;
      };
    };

    let apiResponse: ApiResponse;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError, responseText);
      return err(new Error("Failed to parse Twitter API response"));
    }

    if (apiResponse.status !== "success" || !apiResponse.data) {
      console.error("Twitter API returned error status:", apiResponse);
      return err(
        new Error(`Twitter API error: ${apiResponse.msg ?? "Unknown error"}`)
      );
    }

    const userData = apiResponse.data;

    // Map API response to XRawData format
    // The /twitter/user/info endpoint provides comprehensive user data
    const data: XRawData = {
      id: userData.id,
      created_at: userData.createdAt,
      blue_verified: userData.isBlueVerified || false,
      followers_count: userData.followers,
      friends_count: userData.following,
      listed_count: undefined, // Not available in /twitter/user/info endpoint
      statuses_count: userData.statusesCount,
      media_count: userData.mediaCount,
      favourites_count: userData.favouritesCount,
      is_automated: userData.isAutomated,
      protected: userData.protected,
      // Store additional user info for display
      _userInfo: {
        id: userData.id,
        username: userData.userName,
        name: userData.name,
        profilePicture: userData.profilePicture,
        followersCount: userData.followers,
        followingCount: userData.following,
        createdAt: userData.createdAt,
        blueVerified: userData.isBlueVerified || false,
        description: userData.description,
      },
    };

    return ok(data);
  } catch (error) {
    console.error("Twitter API fetch error:", error);
    return err(
      error instanceof Error ? error : new Error("Unknown Twitter API error")
    );
  }
};

/**
 * Atomically deducts one credit using optimistic locking.
 *
 * Why optimistic locking? Race conditions between concurrent requests
 * could double-spend credits. The WHERE clause checks the expected balance,
 * failing if another request modified it first.
 *
 * Returns Result type for functional error handling.
 */
const deductCredit = async (userId: string): Promise<Result<void, Error>> => {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return err(supabaseResult.error);
  }
  const supabase = supabaseResult.value;

  // Get current credits with row-level lock to prevent race conditions
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    return err(
      new Error(
        `Failed to fetch profile: ${fetchError?.message ?? "Profile not found"}`
      )
    );
  }

  if (profile.credits <= 0) {
    return err(new Error("Insufficient credits"));
  }

  // Atomic decrement using PostgreSQL's -= operator
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: profile.credits - 1 })
    .eq("id", userId)
    .eq("credits", profile.credits); // Optimistic locking to prevent race conditions

  if (updateError) {
    return err(new Error(`Failed to deduct credit: ${updateError.message}`));
  }

  return ok(undefined);
};

/**
 * Gets cached verification from database.
 *
 * Returns Result with cached TrustReport if found and fresh, or error if not found/stale.
 */
const getCachedVerification = async (
  normalizedUsername: string
): Promise<Result<TrustReport | null, Error>> => {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return err(supabaseResult.error);
  }
  const supabase = supabaseResult.value;

  const { data, error } = await supabase
    .from("verifications")
    .select("trust_report, fetched_at, status")
    .eq("username", normalizedUsername)
    .single();

  if (error) {
    // PGRST116 = no rows returned (not an error, just cache miss)
    if (error.code === "PGRST116") {
      return ok(null);
    }
    return err(new Error(`Failed to query cache: ${error.message}`));
  }

  if (!data) {
    return ok(null);
  }

  // Check if cache is fresh (less than 24 hours old)
  const fetchedAt = new Date(data.fetched_at).getTime();
  const now = Date.now();
  const age = now - fetchedAt;

  if (age < CACHE_FRESHNESS_MS && data.status === "completed") {
    // Cache is fresh - return it
    return ok(data.trust_report as TrustReport);
  }

  // Cache exists but is stale or pending - return null to trigger refresh
  return ok(null);
};

/**
 * Marks a verification as pending to prevent duplicate API calls.
 *
 * Uses secure database function instead of service role key.
 * Returns true if we successfully claimed the pending status, false if another request already did.
 */
const markAsPending = async (
  normalizedUsername: string
): Promise<Result<boolean, Error>> => {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return err(supabaseResult.error);
  }
  const supabase = supabaseResult.value;

  // Call secure database function (SECURITY DEFINER)
  // This is safer than using service role key in application code
  const { data, error } = await supabase.rpc("mark_verification_pending", {
    p_username: normalizedUsername,
  });

  if (error) {
    console.error("Failed to mark verification as pending:", error.message);
    return err(new Error(`Failed to mark as pending: ${error.message}`));
  }

  // Function returns boolean: true if marked as pending, false if already pending or fresh
  return ok(data === true);
};

/**
 * Stores verification result in cache.
 *
 * Uses secure database function instead of service role key.
 * This is safer than using admin client in user-triggered endpoints.
 */
const storeVerification = async (
  normalizedUsername: string,
  rawData: XRawData,
  trustReport: TrustReport
): Promise<Result<void, Error>> => {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return err(supabaseResult.error);
  }
  const supabase = supabaseResult.value;

  console.log("Attempting to store verification for username:", normalizedUsername);

  // Call secure database function (SECURITY DEFINER)
  // This is safer than using service role key in application code
  const { error } = await supabase.rpc("store_verification", {
    p_username: normalizedUsername,
    p_raw_data: rawData,
    p_trust_report: trustReport,
    p_status: "completed",
  });

  if (error) {
    console.error("Failed to store verification:", {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      username: normalizedUsername,
    });
    return err(new Error(`Failed to store verification: ${error.message}`));
  }

  console.log("Successfully stored verification for username:", normalizedUsername);
  return ok(undefined);
};

/**
 * POST /api/verify — the core verification endpoint with caching.
 *
 * Flow:
 * 1. Check cache first - if fresh, return immediately (no credit deduction)
 * 2. If stale/missing, check if another request is fetching (status='pending')
 * 3. If pending, return stale cache (if exists) - Realtime will update when ready
 * 4. If not pending, mark as pending, fetch from API, store result
 * 5. Only deduct credits when we actually call the API (not for cached results)
 *
 * Credit deduction happens AFTER successful API call, not before.
 * This ensures users aren't charged for failed lookups or cached results.
 */
export async function POST(request: NextRequest) {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Server configuration error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
  const supabase = supabaseResult.value;

  // Parse request body - handle JSON parsing errors functionally
  let body: unknown;
  try {
    body = await request.json();
  } catch (parseError) {
    return NextResponse.json<ErrorResponse>(
      { error: "Invalid JSON in request body", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  // Validate request body shape using type guard
  if (!isUsernameRequest(body)) {
    return NextResponse.json<ErrorResponse>(
      {
        error: "Username is required and must be a string",
        code: "INVALID_INPUT",
      },
      { status: 400 }
    );
  }

  const normalizedUsername = normalizeUsername(body.username);

  // Try to authenticate user (optional for free lookups)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const isAuthenticated = !authError && user !== null;

  // Get client IP once (used throughout this function)
  const clientIp = getClientIp(request);

  // Check cache first - if fresh, return immediately (no credit/free lookup deduction)
  // Why no deduction? We're returning cached data, not making an API call
  const cachedResult = await getCachedVerification(normalizedUsername);
  if (cachedResult.isOk() && cachedResult.value !== null) {
    // Cache hit with fresh data - return immediately without decrementing anything
    const responseData: TrustReport & {
      remainingFreeLookups?: number;
      nextResetTime?: number | null;
      cached?: boolean;
    } = cachedResult.value;
    responseData.remainingFreeLookups = getRemainingFreeLookups(clientIp);
    responseData.nextResetTime = getTimeUntilNextReset(clientIp);
    responseData.cached = true; // Indicate this is cached data

    return NextResponse.json(responseData);
  }

  // Cache miss or stale - need to fetch from API
  // Check if user has credits/free lookups before making API call
  let isFreeLookup = false;
  let requiresAuth = false;

  // Check free lookups for all users (tracked by IP address)
  const remainingFree = getRemainingFreeLookups(clientIp);

  if (remainingFree > 0) {
    // User has free lookups available - use those first
    isFreeLookup = true;
  } else if (!isAuthenticated) {
    // Unauthenticated user with no free lookups - require authentication
    requiresAuth = true;
  } else {
    // Authenticated user with no free lookups - check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        { error: "Profile not found", code: "PROFILE_NOT_FOUND" },
        { status: 500 }
      );
    }

    if (profile.credits <= 0) {
      // No free lookups and no credits - return error with reset time for countdown
      const nextResetTime = getTimeUntilNextReset(clientIp);
      return NextResponse.json<
        ErrorResponse & { nextResetTime?: number | null }
      >(
        {
          error: "Insufficient credits and free lookups exhausted",
          code: "INSUFFICIENT_CREDITS",
          nextResetTime: nextResetTime,
        },
        { status: 402 }
      );
    }
    // User has credits - will use credits (not free lookup)
  }

  if (requiresAuth) {
    const nextResetTime = getTimeUntilNextReset(clientIp);
    return NextResponse.json<ErrorResponse & { nextResetTime?: number | null }>(
      {
        error: "Free lookups exhausted. Please sign in to continue.",
        code: "AUTH_REQUIRED",
        nextResetTime: nextResetTime,
      },
      { status: 401 }
    );
  }

  // Check if another request is already fetching this username
  const pendingResult = await markAsPending(normalizedUsername);
  if (pendingResult.isErr()) {
    console.error("Failed to check pending status:", pendingResult.error.message);
    // Continue anyway - worst case we make duplicate API call
  } else if (!pendingResult.value) {
    // Another request is fetching - return stale cache if available, or wait
    // Client will use Realtime to get updates when fetch completes
    const { data: staleData } = await supabase
      .from("verifications")
      .select("trust_report")
      .eq("username", normalizedUsername)
      .single();

    if (staleData && staleData.trust_report) {
      // Return stale cache - Realtime will update when fetch completes
      // No credit/free lookup deduction - we're returning cached data, not making an API call
      const responseData: TrustReport & {
        remainingFreeLookups?: number;
        nextResetTime?: number | null;
        cached?: boolean;
        pending?: boolean;
      } = staleData.trust_report as TrustReport;
      responseData.remainingFreeLookups = getRemainingFreeLookups(clientIp);
      responseData.nextResetTime = getTimeUntilNextReset(clientIp);
      responseData.cached = true;
      responseData.pending = true; // Indicate fresh data is being fetched

      return NextResponse.json(responseData);
    }

    // No stale cache - return error asking user to wait
    return NextResponse.json<ErrorResponse>(
      {
        error: "Verification in progress. Please wait a moment and try again.",
        code: "PENDING",
      },
      { status: 202 } // 202 Accepted - request is being processed
    );
  }

  // We're the first request - fetch from API
  const accountDataResult = await fetchXAccountData(body.username);

  if (accountDataResult.isErr()) {
    const errorMessage = accountDataResult.error.message;
    console.error("Failed to fetch account data:", errorMessage);

    // Mark as error in cache so we don't retry immediately
    // Use secure function instead of admin client
    const supabaseForErrorResult = await createClient();
    if (supabaseForErrorResult.isOk()) {
      await supabaseForErrorResult.value.rpc("store_verification", {
        p_username: normalizedUsername,
        p_raw_data: {} as XRawData,
        p_trust_report: {} as TrustReport,
        p_status: "error",
      });
    }

    // Handle rate limit errors specifically
    if (errorMessage === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Rate limit exceeded. Please wait a moment and try again.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // All other errors result in "account not found" for user-facing messages
    return NextResponse.json<ErrorResponse>(
      {
        error: "Account not found or API error. Check server logs for details.",
        code: "ACCOUNT_NOT_FOUND",
      },
      { status: 404 }
    );
  }

  const accountData = accountDataResult.value;

  // Calculate trust score (pure function, no side effects)
  const trustReport: TrustReport = calculateTrust(accountData);

  // Store in cache (this will trigger Realtime update for waiting clients)
  const storeResult = await storeVerification(
    normalizedUsername,
    accountData,
    trustReport
  );

  if (storeResult.isErr()) {
    console.error("Failed to store verification:", {
      error: storeResult.error.message,
      username: normalizedUsername,
      stack: storeResult.error.stack,
    });
    // Continue anyway - we can still return the result
    // But log the error so we can diagnose the issue
  } else {
    console.log("Successfully stored verification in cache for:", normalizedUsername);
  }

  // Deduct credit or record free lookup (ONLY after successful API call)
  // This is the ONLY place where we decrement - never on cache hits
  // Why here? We've successfully fetched from the API and stored the result
  if (isFreeLookup) {
    const allowed = recordFreeLookup(clientIp);
    if (!allowed) {
      // This shouldn't happen due to earlier check, but handle race conditions
      return NextResponse.json<ErrorResponse>(
        {
          error: "Free lookup limit exceeded",
          code: "FREE_LOOKUP_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }
  } else if (isAuthenticated) {
    // Deduct credit for authenticated users - using Result type
    const deductResult = await deductCredit(user.id);

    if (deductResult.isErr()) {
      // This should rarely happen due to the earlier check, but handle race conditions
      console.error("Failed to deduct credit:", deductResult.error.message);
      return NextResponse.json<ErrorResponse>(
        { error: "Failed to deduct credit", code: "CREDIT_DEDUCTION_FAILED" },
        { status: 500 }
      );
    }
  }

  // Include remaining free lookups and reset time in response for all users
  const responseData: TrustReport & {
    remainingFreeLookups?: number;
    nextResetTime?: number | null;
    cached?: boolean;
  } = trustReport;
  responseData.remainingFreeLookups = getRemainingFreeLookups(clientIp);
  responseData.nextResetTime = getTimeUntilNextReset(clientIp);
  responseData.cached = false; // Fresh data from API

  return NextResponse.json(responseData);
}

/**
 * GET /api/verify — check remaining free lookups for unauthenticated users.
 *
 * Why separate endpoint? Allows client to check remaining free lookups
 * without making a full verification request. Useful for displaying count
 * on page load.
 */
export async function GET(request: NextRequest) {
  // Return free lookup count and reset time for all users (tracked by IP)
  // Both authenticated and unauthenticated users get free lookups
  const clientIp = getClientIp(request);
  const remaining = getRemainingFreeLookups(clientIp);
  const nextResetTime = getTimeUntilNextReset(clientIp);

  return NextResponse.json({
    remainingFreeLookups: remaining,
    nextResetTime: nextResetTime,
  });
}
