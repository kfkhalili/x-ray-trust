# X.com OAuth Integration Issues - AI Prompt

## Context

We're building a Next.js 16 application with Supabase authentication that supports OAuth sign-in via Google, GitHub, and X.com (Twitter). The application runs on both localhost (development) and production (https://www.xtrustradar.com).

**Tech Stack:**

- Next.js 16 (App Router)
- Supabase Auth (OAuth 2.0 with PKCE)
- X.com OAuth 2.0 provider
- TypeScript

**Current OAuth Flow:**

1. User clicks "Continue with X" on `http://localhost:3000`
2. App calls `supabase.auth.signInWithOAuth({ provider: 'x', options: { redirectTo: 'http://localhost:3000/auth/callback' } })`
3. Supabase redirects to X.com's OAuth authorize endpoint
4. X.com should redirect back to Supabase's callback URL
5. Supabase should redirect to our callback route (`/auth/callback`)
6. Our callback route exchanges the code for a session and redirects to home

## Problem 1: X.com OAuth Authorization Returns 400 Error

### Symptoms

- When clicking "Continue with X", the browser redirects to X.com's OAuth authorize endpoint
- X.com displays "Something went wrong" error page
- Browser console shows: `GET https://x.com/i/api/2/oauth2/authorize?... Status 400`
- Network request to `https://api.x.com/1.1/onboarding/referrer.json` returns 400

### What We've Verified

- ✅ Supabase X provider is enabled and configured correctly
- ✅ Provider name in code is `'x'` (not `'twitter'`)
- ✅ OAuth redirect URL is correctly generated: `redirect_to=http://localhost:3000/auth/callback`
- ✅ State parameter contains correct `referrer: "http://localhost:3000/auth/callback"`
- ✅ Supabase Redirect URLs include both production and localhost:
  - `https://www.xtrustradar.com/auth/callback`
  - `http://localhost:3000/auth/callback`

### X Developer Portal Configuration

- App Type: OAuth 2.0
- Callback URI: `https://vokilettwttlyrxtafrb.supabase.co/auth/v1/callback` (Supabase callback URL)
- App Permissions: `users.email`, `tweet.read`, `users.read`, `offline.access`
- API Key and API Key Secret are configured in Supabase

### Question

What could cause X.com to return a 400 error on the OAuth authorize endpoint? Are there specific requirements for:

- Callback URI format or configuration?
- App permissions or scopes?
- OAuth 2.0 flow parameters (code_challenge, redirect_uri, etc.)?
- X Developer Portal app settings that might be missing?

## Problem 2: Supabase Redirects to Production Instead of Localhost After OAuth Error

### Symptoms

- When X.com shows an error and user clicks "back"
- User is redirected to `https://www.xtrustradar.com/?error=invalid_request&error_code=bad_oauth_callback&error_description=OAuth+state+parameter+missing`
- Should redirect to `http://localhost:3000/?error=...` instead
- The state parameter appears to be lost/missing in the error redirect

### Root Cause Analysis

When Supabase receives an OAuth error from X.com, it redirects to our callback route. However, Supabase appears to use its configured `site_url` (production: `https://www.xtrustradar.com`) instead of the `referrer` from the JWT state parameter (localhost: `http://localhost:3000/auth/callback`) when determining where to redirect.

**State Parameter Structure:**

```json
{
  "referrer": "http://localhost:3000/auth/callback", // What we want
  "site_url": "https://www.xtrustradar.com", // What Supabase uses
  "provider": "x"
}
```

### What We've Implemented

1. **Callback Route Logic**: Enhanced `/app/auth/callback/route.ts` to:

   - Decode JWT state parameter to extract `referrer`
   - Prioritize localhost redirects from state over production URL
   - Detect localhost requests and use request origin
   - Log detailed redirect decisions for debugging

2. **Client-Side Fallback**: Added to `/app/page.tsx`:
   - Store original origin in `sessionStorage` when OAuth is initiated
   - Detect if user landed on wrong domain (production) after OAuth error
   - Automatically redirect back to original origin (localhost) with error params

### Current Code Behavior

- ✅ Callback route correctly extracts `referrer` from state when state is present
- ✅ Callback route detects localhost requests and redirects appropriately
- ❌ **Issue**: Supabase redirects directly to production site root (`/?error=...`) **before** our callback route is called
- ❌ State parameter is missing in the error redirect URL

### Question

1. Why does Supabase redirect to production (`site_url`) instead of using the `referrer` from the state parameter when handling OAuth errors?
2. Why is the state parameter missing in the error redirect URL?
3. Is there a Supabase configuration option to prioritize `referrer` over `site_url` for error redirects?
4. Should we configure Supabase differently, or is this a limitation we need to work around with client-side redirects?

## Additional Context

**Environment Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `NEXT_PUBLIC_APP_URL`: Production URL (only set in production, not in localhost)
- `SUPABASE_AUTH_EXTERNAL_TWITTER_CLIENT_ID`: X.com API Key
- `SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET`: X.com API Key Secret

**Supabase Configuration:**

- Site URL: `https://www.xtrustradar.com`
- Redirect URLs: Both production and localhost are listed

**Files Involved:**

- `/components/AuthButton.tsx` - Initiates OAuth, stores origin in sessionStorage
- `/app/auth/callback/route.ts` - Handles OAuth callback, determines redirect origin
- `/app/page.tsx` - Client-side redirect fallback for wrong domain
- `/app/api/auth/session/route.ts` - Session check endpoint (recently fixed to return 200 instead of 401 for no session)

## What We Need Help With

1. **For Problem 1**: Identify what's causing X.com to return 400 on the OAuth authorize endpoint. Is it a configuration issue in X Developer Portal, or something in how we're calling Supabase's OAuth?

2. **For Problem 2**: Understand why Supabase redirects to production instead of localhost after OAuth errors, and whether there's a better solution than our client-side redirect workaround.

3. **General**: Are there best practices for handling OAuth errors in multi-environment setups (localhost + production) that we should follow?
