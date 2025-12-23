# Fix: OAuth Callback Redirecting to Localhost

## Problem

When using OAuth (Google/GitHub), the callback is redirecting to `localhost` even on production.

## Root Cause

The code was using `window.location.origin` which works for local development but can cause issues. More importantly, **Supabase needs to have your redirect URLs configured** in its URL Configuration settings.

## Solution

### 1. Code Fix (Already Done ✅)

The code now uses `NEXT_PUBLIC_APP_URL` if set:
- Production: Uses `NEXT_PUBLIC_APP_URL` from environment variables
- Local dev: Falls back to `window.location.origin` (localhost:3000)

### 2. Configure Supabase Redirect URLs (REQUIRED)

**This is the critical step that's likely missing:**

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project**
3. **Navigate to**: Authentication → **URL Configuration**
4. **Set Site URL**: Your production URL
   - Example: `https://www.xtrustradar.com`
5. **Add Redirect URLs** (one per line):
   ```
   https://www.xtrustradar.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   - Add your production URL first
   - Add localhost for local testing
6. **Click "Save"**

### 3. Set NEXT_PUBLIC_APP_URL in Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add or update**:
   ```
   NEXT_PUBLIC_APP_URL=https://www.xtrustradar.com
   ```
   (Or your actual production URL)
3. **Select "Production"** environment
4. **Click "Save"**
5. **Redeploy** your application

### 4. Verify Google OAuth Redirect URI

In Google Cloud Console:
1. Go to your OAuth Client
2. **Authorized redirect URIs** should include:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase callback)
   - Your production URL is NOT needed here - Supabase handles the redirect

## How OAuth Flow Works

1. User clicks "Continue with Google"
2. App calls `supabase.auth.signInWithOAuth()` with `redirectTo: https://www.xtrustradar.com/auth/callback`
3. Supabase redirects user to Google
4. User authorizes on Google
5. Google redirects back to Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`
6. Supabase processes the OAuth code
7. Supabase redirects to your app: `https://www.xtrustradar.com/auth/callback`
8. Your `/auth/callback` route exchanges the code for a session
9. User is logged in

## Why Localhost Was Being Used

If `NEXT_PUBLIC_APP_URL` is not set:
- The code falls back to `window.location.origin`
- On localhost, this is `http://localhost:3000`
- On production, this should be your production URL
- But if Supabase doesn't have the redirect URL configured, it might reject it

## Verification Steps

After configuring:

1. ✅ Check Supabase Dashboard → Authentication → URL Configuration
   - Site URL is set to production URL
   - Redirect URLs include production callback URL

2. ✅ Check Vercel Environment Variables
   - `NEXT_PUBLIC_APP_URL` is set to production URL

3. ✅ Test OAuth login
   - Should redirect to production URL, not localhost

4. ✅ Check browser network tab
   - After Google authorization, should redirect to `https://www.xtrustradar.com/auth/callback`
   - Not `http://localhost:3000/auth/callback`

## Still Not Working?

If it's still redirecting to localhost:

1. **Clear browser cache** or use incognito mode
2. **Check browser console** for errors
3. **Verify NEXT_PUBLIC_APP_URL** is actually set in Vercel (redeploy if needed)
4. **Check Supabase logs** for redirect errors
5. **Verify the redirect URL** in Supabase matches exactly (no trailing slashes)

