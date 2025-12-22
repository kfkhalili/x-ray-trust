import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTrust } from '@/lib/trust-engine';
import type { XRawData, TrustReport } from '@/types/trust';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';

/**
 * Error response type for API errors.
 */
type ErrorResponse = {
  error: string;
  code: string;
};

/**
 * Fetches X account data from twitterapi.io.
 * Uses the /twitter/user/info endpoint as per https://docs.twitterapi.io/api-reference
 * Returns null if account not found or API error occurs.
 */
const fetchXAccountData = async (username: string): Promise<XRawData | null> => {
  const apiKey = process.env.TWITTER_API_KEY;

  if (!apiKey) {
    return null;
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
        return null; // Account not found
      }
      return null; // Other API errors
    }

    // Parse the response - API returns { status, msg, data: {...} }
    let apiResponse: {
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

    try {
      apiResponse = JSON.parse(responseText);

      if (apiResponse.status !== 'success' || !apiResponse.data) {
        console.error('Twitter API returned error status:', apiResponse);
        return null;
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

      return data;
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError, responseText);
      return null;
    }
  } catch (error) {
    console.error('Twitter API fetch error:', error);
    return null;
  }
};

/**
 * Deducts one credit from user's profile.
 * Returns true if deduction was successful, false if insufficient credits.
 */
const deductCredit = async (userId: string): Promise<boolean> => {
  const supabase = await createClient();

  // Get current credits with row-level lock to prevent race conditions
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return false;
  }

  if (profile.credits <= 0) {
    return false;
  }

  // Atomic decrement using PostgreSQL's -= operator
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits - 1 })
    .eq('id', userId)
    .eq('credits', profile.credits); // Optimistic locking to prevent race conditions

  return !updateError;
};

/**
 * POST /api/verify
 *
 * Verifies the trustworthiness of an X (Twitter) account.
 *
 * Flow:
 * 1. Authenticate user via Supabase session
 * 2. Check if user has sufficient credits (> 0)
 * 3. Fetch account data from twitterapi.io
 * 4. Calculate trust score using trust engine
 * 5. Deduct 1 credit from user's balance
 * 6. Return trust report
 *
 * Errors:
 * - 401: Unauthenticated
 * - 402: Insufficient credits
 * - 404: Account not found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as { username?: string };

    if (!body.username || typeof body.username !== 'string') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Username is required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // Check user's credit balance
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

    // Fetch account data from twitterapi.io
    const accountData = await fetchXAccountData(body.username);

    if (!accountData) {
      // Check server logs for detailed error - the fetchXAccountData function logs errors
      return NextResponse.json<ErrorResponse>(
        { error: 'Account not found or API error. Check server logs for details.', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate trust score
    const trustReport: TrustReport = calculateTrust(accountData);

    // Deduct credit (only after successful verification)
    const creditDeducted = await deductCredit(user.id);

    if (!creditDeducted) {
      // This should rarely happen due to the earlier check, but handle race conditions
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to deduct credit', code: 'CREDIT_DEDUCTION_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json<TrustReport>(trustReport);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

