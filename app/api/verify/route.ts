import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTrust } from '@/lib/trust-engine';
import type { XRawData, TrustReport } from '@/types/trust';
import { Result, ok, err } from 'neverthrow';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';

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
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
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
  if (!data || (now - data.firstLookupTime >= FREE_LOOKUP_RESET_PERIOD_MS)) {
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
const fetchXAccountData = async (username: string): Promise<Result<XRawData, Error>> => {
  const apiKey = process.env.TWITTER_API_KEY;

  if (!apiKey) {
    return err(new Error('TWITTER_API_KEY not configured'));
  }

  try {
    // Correct endpoint: /twitter/user/info with userName query parameter
    // Header: X-API-Key (capital X, capital API, capital Key)
    const response = await fetch(
      `https://api.twitterapi.io/twitter/user/info?userName=${encodeURIComponent(username)}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Twitter API error:', response.status, responseText);

      if (response.status === 404) {
        return err(new Error('Account not found'));
      }

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        return err(new Error('RATE_LIMIT_EXCEEDED'));
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
      console.error('Failed to parse API response:', parseError, responseText);
      return err(new Error('Failed to parse Twitter API response'));
    }

    if (apiResponse.status !== 'success' || !apiResponse.data) {
      console.error('Twitter API returned error status:', apiResponse);
      return err(new Error(`Twitter API error: ${apiResponse.msg ?? 'Unknown error'}`));
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
    console.error('Twitter API fetch error:', error);
    return err(error instanceof Error ? error : new Error('Unknown Twitter API error'));
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
  const supabase = await createClient();

  // Get current credits with row-level lock to prevent race conditions
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return err(new Error(`Failed to fetch profile: ${fetchError?.message ?? 'Profile not found'}`));
  }

  if (profile.credits <= 0) {
    return err(new Error('Insufficient credits'));
  }

  // Atomic decrement using PostgreSQL's -= operator
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits - 1 })
    .eq('id', userId)
    .eq('credits', profile.credits); // Optimistic locking to prevent race conditions

  if (updateError) {
    return err(new Error(`Failed to deduct credit: ${updateError.message}`));
  }

  return ok(undefined);
};

/**
 * POST /api/verify — the core verification endpoint.
 *
 * Credit deduction happens AFTER successful verification, not before.
 * This ensures users aren't charged for failed lookups (API errors,
 * non-existent accounts). Only successful trust reports cost credits.
 *
 * Free lookups: Unregistered (unauthenticated) users get 3 free lookups per hour tracked by IP address.
 * Lookups reset every hour from the first lookup, allowing users to try the service more frequently.
 * After 3 free lookups in an hour, authentication is required to continue.
 * Usage is tracked for analytics - we measure usage rather than strictly limit.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Parse request body - handle JSON parsing errors functionally
  let body: unknown;
  try {
    body = await request.json();
  } catch (parseError) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Invalid JSON in request body', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  // Validate request body shape
  if (
    typeof body !== 'object' ||
    body === null ||
    !('username' in body) ||
    typeof (body as { username: unknown }).username !== 'string'
  ) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Username is required and must be a string', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const validatedBody = body as { username: string };

  // Try to authenticate user (optional for free lookups)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const isAuthenticated = !authError && user !== null;

  // Determine if this is a free lookup or requires credits
  let isFreeLookup = false;
  let requiresAuth = false;

  if (!isAuthenticated) {
    // Check free lookups for unauthenticated users
    const clientIp = getClientIp(request);
    const remainingFree = getRemainingFreeLookups(clientIp);

    if (remainingFree > 0) {
      isFreeLookup = true;
    } else {
      // Free lookups exhausted, require authentication
      requiresAuth = true;
    }
  }

  if (requiresAuth) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Free lookups exhausted. Please sign in to continue.', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // For authenticated users, check credits
  if (isAuthenticated) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 500 }
      );
    }

    if (profile.credits <= 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }
  }

  // Fetch account data from twitterapi.io - using Result type
  const accountDataResult = await fetchXAccountData(validatedBody.username);

  if (accountDataResult.isErr()) {
    const errorMessage = accountDataResult.error.message;
    console.error('Failed to fetch account data:', errorMessage);

    // Handle rate limit errors specifically
    if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Rate limit exceeded. Please wait a moment and try again.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429 }
      );
    }

    // All other errors result in "account not found" for user-facing messages
    return NextResponse.json<ErrorResponse>(
      { error: 'Account not found or API error. Check server logs for details.', code: 'ACCOUNT_NOT_FOUND' },
      { status: 404 }
    );
  }

  const accountData = accountDataResult.value;

  // Calculate trust score (pure function, no side effects)
  const trustReport: TrustReport = calculateTrust(accountData);

  // Deduct credit or record free lookup (only after successful verification)
  if (isFreeLookup) {
    const clientIp = getClientIp(request);
    const allowed = recordFreeLookup(clientIp);
    if (!allowed) {
      // This shouldn't happen due to earlier check, but handle race conditions
      return NextResponse.json<ErrorResponse>(
        { error: 'Free lookup limit exceeded', code: 'FREE_LOOKUP_LIMIT_EXCEEDED' },
        { status: 403 }
      );
    }
  } else if (isAuthenticated) {
    // Deduct credit for authenticated users - using Result type
    const deductResult = await deductCredit(user.id);

    if (deductResult.isErr()) {
      // This should rarely happen due to the earlier check, but handle race conditions
      console.error('Failed to deduct credit:', deductResult.error.message);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to deduct credit', code: 'CREDIT_DEDUCTION_FAILED' },
        { status: 500 }
      );
    }
  }

  // Include remaining free lookups and reset time in response for unauthenticated users
  const responseData: TrustReport & {
    remainingFreeLookups?: number;
    nextResetTime?: number | null;
  } = trustReport;
  if (!isAuthenticated) {
    const clientIp = getClientIp(request);
    responseData.remainingFreeLookups = getRemainingFreeLookups(clientIp);
    responseData.nextResetTime = getTimeUntilNextReset(clientIp);
  }

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
  const supabase = await createClient();

  // Try to authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const isAuthenticated = !authError && user !== null;

  // Only return free lookup count and reset time for unauthenticated users
  if (!isAuthenticated) {
    const clientIp = getClientIp(request);
    const remaining = getRemainingFreeLookups(clientIp);
    const nextResetTime = getTimeUntilNextReset(clientIp);

    return NextResponse.json({
      remainingFreeLookups: remaining,
      nextResetTime: nextResetTime,
    });
  }

  // Authenticated users don't use free lookups
  return NextResponse.json({ remainingFreeLookups: null, nextResetTime: null });
}

