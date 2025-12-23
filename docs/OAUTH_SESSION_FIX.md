# Fix: User Created But App Doesn't Recognize Login

## Problem

After OAuth login (Google/GitHub), the user is created successfully in Supabase, but the app doesn't recognize you're logged in.

## Root Cause

The session cookie isn't being set or read properly. This is usually due to Supabase URL Configuration not being set correctly.

## Quick Fix Checklist

### 1. Verify Supabase URL Configuration (MOST IMPORTANT)

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project**
3. **Navigate to**: Authentication → **URL Configuration**
4. **Check these settings**:

   - **Site URL**: Should be your production URL
     - Example: `https://www.xtrustradar.com` (or your Vercel URL)
     - NOT `http://localhost:3000` for production

   - **Redirect URLs** (one per line):
     ```
     https://www.xtrustradar.com/auth/callback
     http://localhost:3000/auth/callback
     ```
     - Must include your production callback URL
     - Must include localhost for local testing
     - No trailing slashes
     - Must match exactly (case-sensitive)

5. **Click "Save"** (very important!)

6. **Wait 30 seconds** for changes to propagate

### 2. Verify Environment Variables

**In Vercel** (for production):
- `NEXT_PUBLIC_SUPABASE_URL` - Should match your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Should match your Supabase anon key
- `NEXT_PUBLIC_APP_URL` - Should be your production URL (e.g., `https://www.xtrustradar.com`)

**In `.env.local`** (for local development):
- Same variables as above, but with local values

### 3. Test the Flow

1. **Clear browser cache** or use incognito mode
2. **Try logging in with Google/GitHub**
3. **Check browser DevTools** → Application → Cookies
   - Look for cookies starting with `sb-` (Supabase cookies)
   - Should see cookies like `sb-<project-ref>-auth-token`
4. **Check browser console** for any errors

### 4. Verify Cookie Settings

In browser DevTools → Application → Cookies, check:

- **Domain**: Should match your domain (e.g., `.xtrustradar.com` or `localhost`)
- **Path**: Should be `/`
- **SameSite**: Should be `Lax` or `None` (if using HTTPS)
- **Secure**: Should be `true` for HTTPS, `false` for localhost

### 5. Check Network Tab

1. **Open browser DevTools** → Network tab
2. **Try logging in**
3. **Look for the `/auth/callback` request**:
   - Should return `302 Redirect` status
   - Should have `Set-Cookie` headers in the response
   - Should redirect to `/?auth=success`

### 6. Check Supabase Logs

1. **Go to Supabase Dashboard** → Logs → API Logs
2. **Look for authentication events** around the time you logged in
3. **Check for any errors** related to session creation

## Common Issues

### Issue: "Redirect URLs don't match"

**Solution**:
- In Supabase Dashboard → Authentication → URL Configuration
- Make sure Redirect URLs include your exact callback URL
- No trailing slashes
- Must be HTTPS for production (not HTTP)

### Issue: "Cookies not being set"

**Solution**:
- Check that `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
- Verify Supabase URL Configuration has your callback URL
- Check browser console for cookie-related errors
- Try in incognito mode to rule out cookie blockers

### Issue: "Session exists but app doesn't see it"

**Solution**:
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check that client-side code is calling `supabase.auth.getUser()` or `supabase.auth.getSession()`
- Verify the Supabase client is using the correct project URL

### Issue: "Works locally but not in production"

**Solution**:
- Check that `NEXT_PUBLIC_APP_URL` is set in Vercel (not just `.env.local`)
- Verify Supabase URL Configuration has production URL (not just localhost)
- Redeploy your Vercel app after setting environment variables

## Debug Steps

1. **Open browser console** and look for:
   ```javascript
   // Should see these logs from AuthButton component:
   "Checking user: { user: 'your@email.com', session: 'has session', error: 'none' }"
   ```

2. **If you see "no user" or "no session"**:
   - Check that cookies are being set (DevTools → Application → Cookies)
   - Verify Supabase URL Configuration
   - Check browser console for errors

3. **If cookies exist but session is null**:
   - The cookies might be for a different Supabase project
   - Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project

## Still Not Working?

1. **Check Supabase Dashboard** → Authentication → Providers
   - Verify Google/GitHub is enabled
   - Verify Client ID and Secret are filled in
   - Click "Save" if you made changes

2. **Try signing out and signing in again**:
   - Clear all cookies for your domain
   - Try OAuth login again

3. **Check for browser extensions**:
   - Ad blockers or privacy extensions might block cookies
   - Try in incognito mode or disable extensions

4. **Verify the callback route is being hit**:
   - Add `console.log('Callback hit')` in `app/auth/callback/route.ts`
   - Check server logs (Vercel logs) to see if callback is being called

## Code Changes Made

The callback route was updated to use `NextResponse.redirect()` instead of `redirect()` to ensure cookies are properly set before redirecting. This should help with cookie persistence.

