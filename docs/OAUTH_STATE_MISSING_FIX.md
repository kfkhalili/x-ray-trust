# OAuth State Parameter Missing - Fix Documentation

## Problem

When X.com OAuth fails or doesn't preserve the state parameter, Supabase redirects directly to the `site_url` (production) with the error:

```
https://www.xtrustradar.com/?error=invalid_request&error_code=bad_oauth_callback&error_description=OAuth+state+parameter+missing
```

This bypasses our callback route entirely, so we can't extract the original redirect URL from the state parameter.

## Root Cause

1. **X.com doesn't preserve state parameter**: When X.com has an error or redirects back, it may not include the `state` parameter in the redirect URL
2. **Supabase defaults to site_url**: When the state parameter is missing, Supabase can't determine the original redirect URL, so it defaults to the configured `site_url` (production)
3. **Bypasses callback route**: Since Supabase redirects directly to the site_url with the error, our callback route never gets called

## Solution

### 1. Client-Side Redirect (Primary Fix)

The main fix is in `app/page.tsx` - a client-side redirect that detects when the user lands on the wrong domain after an OAuth error:

```typescript
// Check if user landed on wrong domain after OAuth error
const params = new URLSearchParams(window.location.search);
const hasOAuthError = params.has("error") && params.has("error_code");
const storedOrigin = sessionStorage.getItem("oauth_origin");

if (hasOAuthError && storedOrigin && storedOrigin !== window.location.origin) {
  // Redirect back to original origin with error params
  const redirectUrl = new URL(window.location.pathname, storedOrigin);
  redirectUrl.search = window.location.search;
  window.location.href = redirectUrl.toString();
  return;
}
```

### 2. SessionStorage Tracking

In `components/AuthButton.tsx`, we store the original origin before initiating OAuth:

```typescript
// Store the original origin before OAuth redirect
sessionStorage.setItem("oauth_origin", window.location.origin);
sessionStorage.setItem("oauth_provider", provider);
sessionStorage.setItem("oauth_timestamp", Date.now().toString());
```

### 3. Enhanced Error Logging

Added detailed logging to help debug OAuth errors:

```typescript
if (hasOAuthError) {
  console.error("OAuth error detected:", {
    error: params.get("error"),
    errorCode: params.get("error_code"),
    errorDescription: params.get("error_description"),
    currentOrigin: window.location.origin,
    storedOrigin,
    isWrongDomain: storedOrigin && storedOrigin !== window.location.origin,
  });
}
```

## How It Works

1. **User clicks "Continue with X"** on `http://localhost:3000`
2. **Origin is stored** in `sessionStorage` as `oauth_origin`
3. **OAuth flow starts** - user is redirected to X.com
4. **X.com fails** and redirects back to Supabase without state parameter
5. **Supabase redirects** to `site_url` (production) with error
6. **Client-side code detects** the error and wrong domain
7. **Automatic redirect** back to `http://localhost:3000` with error params

## Testing

To test this fix:

1. Start OAuth flow from `http://localhost:3000`
2. Trigger an error (or let X.com fail)
3. Verify you're redirected back to `http://localhost:3000/?error=...` (not production)

## Limitations

- **SessionStorage dependency**: If sessionStorage is cleared or not available, the redirect won't work
- **Supabase behavior**: We can't control Supabase's redirect behavior when state is missing
- **X.com state preservation**: We can't force X.com to preserve the state parameter

## Future Improvements

1. **Server-side fallback**: Could add a server-side API route that checks for OAuth errors and redirects
2. **Cookie-based tracking**: Use cookies instead of sessionStorage for more persistence
3. **X.com configuration**: Investigate if X.com has settings to ensure state parameter preservation

## Related Files

- `app/page.tsx` - Client-side redirect logic
- `components/AuthButton.tsx` - OAuth initiation and origin storage
- `app/auth/callback/route.ts` - Callback route (not called when state is missing)
- `docs/X_OAUTH_ISSUES.md` - Related OAuth issues documentation

