# OAuth Troubleshooting: "Provider is not enabled" Error

## Error: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

This error means the OAuth provider (Google, GitHub, or Twitter/X) is **not enabled** in your Supabase Dashboard, OR the configuration is incomplete.

## Quick Checklist

If you're using **Production Supabase** (not local):

1. ✅ Go to Supabase Dashboard → Authentication → Providers
2. ✅ Find "Google" and verify it's **enabled** (toggle is ON)
3. ✅ Verify **Client ID** is filled in (not empty)
4. ✅ Verify **Client Secret** is filled in (not empty)
5. ✅ Click **"Save"** button (important!)
6. ✅ Wait a few seconds for changes to propagate
7. ✅ Try logging in again

If you're using **Local Supabase** (`npx supabase start`):

- See "Local Development Setup" section below

## Quick Fix

### For Google OAuth (Production Supabase)

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project** (make sure it's the right one!)
3. **Navigate to**: Authentication → **Providers**
4. **Find "Google"** in the list
5. **Click to expand** the Google provider section
6. **Verify the toggle "Enable Google provider"** is ON (green/enabled)
7. **Check that both fields are filled**:
   - **Client ID (for OAuth)**: Should have your Google Client ID (starts with numbers/letters)
   - **Client Secret (for OAuth)**: Should have your Google Client Secret (long string)
8. **If fields are empty or incorrect**:
   - Get your Client ID and Secret from Google Cloud Console
   - Paste them into the fields
9. **Click "Save"** button (very important - changes don't apply until you save!)
10. **Wait 10-30 seconds** for changes to propagate
11. **Try logging in again**

**Common mistakes:**

- ❌ Enabled the toggle but didn't click "Save"
- ❌ Entered Client ID but forgot Client Secret
- ❌ Copied credentials with extra spaces
- ❌ Looking at wrong Supabase project

### For GitHub OAuth

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project**
3. **Navigate to**: Authentication → **Providers**
4. **Find "GitHub"** in the list
5. **Click to expand** the GitHub provider section
6. **Toggle "Enable GitHub provider"** to ON
7. **Enter your credentials**:
   - **Client ID (for OAuth)**: Your GitHub OAuth Client ID
   - **Client Secret (for OAuth)**: Your GitHub OAuth Client Secret
8. **Click "Save"**

### For Twitter/X.com OAuth (Production Supabase)

**⚠️ CRITICAL**: There are TWO Twitter providers in Supabase. You MUST use the correct one:

- ✅ **"X / Twitter (OAuth 2.0)"** - Use this one (the new OAuth 2.0 version)
- ❌ **"Twitter (Deprecated)"** - Do NOT use this (old OAuth 1.0a, being deprecated)

**The provider name in code is `'x'`** (not `'twitter'`). See [Supabase docs](https://supabase.com/docs/guides/auth/social-login/auth-twitter).

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project** (make sure it's the right one!)
3. **Navigate to**: Authentication → **Providers**
4. **Find "X / Twitter (OAuth 2.0)"** in the list (NOT "Twitter (Deprecated)")
5. **Click to expand** the "X / Twitter (OAuth 2.0)" provider section
6. **Verify the toggle "Enable Twitter provider"** is ON (green/enabled)
7. **Check that both fields are filled**:
   - **Client ID (for OAuth)**: Should be your X.com **API Key** (from X Developer Portal)
   - **Client Secret (for OAuth)**: Should be your X.com **API Key Secret** (from X Developer Portal)
8. **If fields are empty or incorrect**:
   - Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Navigate to your app → **Keys and tokens** tab
   - Copy the **API Key** (this is your Client ID)
   - Copy the **API Key Secret** (this is your Client Secret)
   - Paste them into Supabase fields
9. **Click "Save"** button (very important - changes don't apply until you save!)
10. **Wait 10-30 seconds** for changes to propagate
11. **Try logging in again**

**Common mistakes for Twitter/X:**

- ❌ Enabled the toggle but didn't click "Save"
- ❌ Used the wrong credentials (API Key vs API Key Secret)
- ❌ Copied credentials with extra spaces or line breaks
- ❌ Looking at wrong Supabase project
- ❌ Provider not fully saved (must click "Save" after enabling)
- ❌ Using Bearer Token instead of API Key/Secret (wrong credentials)

### "Something went wrong" Error from X.com

**If you see the X.com error page saying "You weren't able to give access to the App":**

This means X.com is rejecting the OAuth request. Check these settings in your X Developer Portal:

1. **Callback URL must match exactly**:
   - Go to X Developer Portal → Your App → **Settings** → **User authentication settings**
   - **Callback URI / Redirect URL** must be: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Replace `<your-project-ref>` with your actual Supabase project reference
   - Example: `https://vokilettwttlyrxtafrb.supabase.co/auth/v1/callback`
   - **No trailing slashes**
   - **Must be HTTPS** (not HTTP)
   - Must match exactly (case-sensitive)

2. **App Type must be correct**:
   - In **User authentication settings**, **Type of App** must be: **"Web App, Automated App or Bot"**
   - NOT "Native App" or other types

3. **App Permissions**:
   - **App permissions** should be set (usually "Read" is sufficient)
   - Make sure **"Request email from users"** is turned ON (important!)

4. **Website URL**:
   - Should be your app's URL (e.g., `https://yourdomain.com` or `http://localhost:3000` for dev)
   - This is different from the Callback URL

5. **Save all changes** in X Developer Portal

**After fixing, wait 1-2 minutes** for changes to propagate, then try again.

**Note for Localhost Testing:**
- The callback URI in X.com should **always** be the Supabase callback URL (not localhost)
- X.com redirects to Supabase, then Supabase redirects to your app (localhost or production)
- Make sure Supabase has `http://localhost:3000/auth/callback` in its Redirect URLs configuration
- The "Something went wrong" error often means the app type or permissions aren't configured correctly

## If You Don't Have OAuth Credentials Yet

You need to create OAuth apps first:

### Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create OAuth Client ID** (see `docs/OAUTH_SETUP.md` for detailed steps)
3. **Get Client ID and Secret**
4. **Add to Supabase** (steps above)

### GitHub OAuth Setup

1. **Go to GitHub Developer Settings**: https://github.com/settings/developers
2. **Create OAuth App** (see `docs/OAUTH_SETUP.md` for detailed steps)
3. **Get Client ID and Secret**
4. **Add to Supabase** (steps above)

### Twitter/X.com OAuth Setup

1. **Go to X Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. **Create OAuth App** (see `docs/OAUTH_SETUP.md` for detailed steps)
3. **Get API Key and API Key Secret** (these are your Client ID and Secret)
4. **Add to Supabase** (steps above)

## Important: Redirect URLs

Make sure your OAuth apps have the correct redirect URL:

**For Google:**

- Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Find your project ref in Supabase Dashboard → Settings → API

**For GitHub:**

- Authorization callback URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`

**For Twitter/X.com:**

- Callback URI / Redirect URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`

## After Enabling

1. **Save the provider settings** in Supabase
2. **Try logging in again** with Google/GitHub/Twitter
3. **Check browser console** if you still get errors

## Common Issues

### "Redirect URI mismatch"

- Check that the redirect URI in your OAuth app matches exactly: `https://<project-ref>.supabase.co/auth/v1/callback`
- No trailing slashes
- Must be HTTPS (not HTTP)

### "Invalid client"

- Double-check Client ID and Secret are correct
- Make sure there are no extra spaces when copying
- For GitHub, make sure you generated a new client secret

### "Callback is calling localhost" Error

**If you're on production but OAuth redirects to localhost:**

1. **Check Supabase URL Configuration**:

   - Go to Supabase Dashboard → Authentication → **URL Configuration**
   - **Site URL** should be your production URL (e.g., `https://www.xtrustradar.com`)
   - **Redirect URLs** must include your production callback URL:
     - `https://www.xtrustradar.com/auth/callback`
   - Click **Save**

2. **Set NEXT_PUBLIC_APP_URL environment variable**:

   - In Vercel: Settings → Environment Variables
   - Add: `NEXT_PUBLIC_APP_URL=https://www.xtrustradar.com`
   - Redeploy your application

3. **Verify the code uses the correct URL**:
   - The code now uses `NEXT_PUBLIC_APP_URL` if set, otherwise falls back to `window.location.origin`
   - Make sure `NEXT_PUBLIC_APP_URL` is set in production

### Still not working?

- Check Supabase Dashboard → Authentication → Providers to confirm it's enabled
- Verify the Client ID and Secret are saved correctly
- Check Supabase Dashboard → Authentication → URL Configuration has your production URL
- Check browser console for more detailed error messages
- See full setup guide: `docs/OAUTH_SETUP.md`
