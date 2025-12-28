# OAuth Setup Guide (Google, GitHub & X.com)

This guide explains how to set up Google, GitHub, and X.com OAuth login for X Trust Radar.

## Overview

OAuth credentials are configured in **Supabase Dashboard**, not in your code. You need to:
1. Create OAuth apps in Google Cloud Console, GitHub, and X Developer Portal
2. Get Client IDs and Secrets
3. Add them to Supabase Dashboard
4. Done! The code already handles the OAuth flow.

## Step 1: Google OAuth Setup

### 1.1 Create Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure OAuth consent screen first:
   - User Type: **External** (unless you have Google Workspace)
   - App name: **X Trust Radar** (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (default is fine)
   - Test users: Add your email if in testing mode
   - Click **Save and Continue** → **Back to Dashboard**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **X Trust Radar Web Client**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (your production URL)
   - **Authorized redirect URIs:**
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Replace `<your-project-ref>` with your Supabase project reference
     - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - Click **Create**

7. **Copy the Client ID and Client Secret** (you'll need these for Supabase)

### 1.2 Add to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Google provider**
6. Enter:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
7. Click **Save**

## Step 2: X.com (Twitter) OAuth Setup

### 2.1 Create X.com OAuth App

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project (or select existing)
3. Create a new app within your project
4. Go to **Settings** → **User authentication settings**
5. Click **Set up** or **Edit** to configure OAuth
6. Configure OAuth settings:
   - **App permissions**: Read (or Read and Write if needed)
   - **Type of App**: Web App, Automated App or Bot
   - **Callback URI / Redirect URL**:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Replace `<your-project-ref>` with your Supabase project reference
     - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - **Website URL**: Your app URL (e.g., `https://yourdomain.com`)
7. Click **Save**
8. Go to **Keys and tokens** tab
9. **Copy the API Key** (this is your Client ID)
10. **Copy the API Key Secret** (this is your Client Secret)

**Note**: X.com uses "API Key" and "API Key Secret" instead of "Client ID" and "Client Secret", but they serve the same purpose.

### 2.2 Add to Supabase

**⚠️ IMPORTANT**: There are TWO Twitter providers in Supabase. You MUST use the correct one:

- ✅ **"X / Twitter (OAuth 2.0)"** - Use this one (the new OAuth 2.0 version)
- ❌ **"Twitter (Deprecated)"** - Do NOT use this (old OAuth 1.0a, being deprecated)

**Note**: The provider name in code is `'x'` (not `'twitter'`). See [Supabase docs](https://supabase.com/docs/guides/auth/social-login/auth-twitter).

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **"X / Twitter (OAuth 2.0)"** (NOT "Twitter (Deprecated)") and click to expand
5. Toggle **Enable X / Twitter (OAuth 2.0) provider**
6. Enter:
   - **Client ID (for OAuth)**: Your X.com API Key
   - **Client Secret (for OAuth)**: Your X.com API Key Secret
7. Click **Save**

## Step 3: GitHub OAuth Setup

### 3.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: X Trust Radar (or your app name)
   - **Homepage URL**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorization callback URL**:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - Replace `<your-project-ref>` with your Supabase project reference
     - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
4. Click **Register application**
5. **Copy the Client ID**
6. Click **Generate a new client secret**
7. **Copy the Client Secret** (you'll only see it once!)

### 3.2 Add to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **GitHub** and click to expand
5. Toggle **Enable GitHub provider**
6. Enter:
   - **Client ID (for OAuth)**: Your GitHub Client ID
   - **Client Secret (for OAuth)**: Your GitHub Client Secret
7. Click **Save**

## Step 4: Configure for Local Development (If Using Local Supabase)

**⚠️ IMPORTANT: These environment variables are ONLY needed for local Supabase development.**

**If you're using production Supabase** (which is the default), you do NOT need these variables. OAuth is configured in the Supabase Dashboard, and your Next.js app doesn't need these env vars.

**If you're using local Supabase** (`npx supabase start`), you need to configure OAuth in `supabase/config.toml`:

1. **Add OAuth credentials to `.env.local`** (for local development only):
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id_here
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret_here
   SUPABASE_AUTH_EXTERNAL_TWITTER_CLIENT_ID=your_x_api_key_here
   SUPABASE_AUTH_EXTERNAL_TWITTER_SECRET=your_x_api_key_secret_here
   SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=your_github_client_id_here
   SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=your_github_client_secret_here
   ```

   **Do NOT add these to Vercel environment variables** - they're only for local Supabase!

2. **Restart local Supabase**:
   ```bash
   npx supabase stop
   npx supabase start
   ```

3. **Update Google OAuth redirect URI** to include local Supabase:
   - In Google Cloud Console, add: `http://127.0.0.1:54321/auth/v1/callback`
   - (In addition to the production Supabase URL)

4. **Update X.com OAuth callback URL** to include local Supabase:
   - In X Developer Portal, add: `http://127.0.0.1:54321/auth/v1/callback`
   - (In addition to the production Supabase URL)

5. **Update GitHub OAuth callback URL** to include local Supabase:
   - In GitHub Developer Settings, add: `http://127.0.0.1:54321/auth/v1/callback`
   - (In addition to the production Supabase URL)

## Step 5: Configure Redirect URLs in Supabase (Production)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL**: Your production URL (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 6: Test OAuth Login

1. Start your dev server: `npm run dev`
2. Click **Sign In** button
3. Click **Continue with Google**, **Continue with GitHub**, or **Continue with X**
4. You should be redirected to the OAuth provider
5. After authorizing, you'll be redirected back and logged in

## Troubleshooting

### "Redirect URI mismatch" Error

**Google:**
- Check that your redirect URI in Google Cloud Console exactly matches: `https://<project-ref>.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes

**X.com:**
- Check that your Callback URI in X Developer Portal exactly matches: `https://<project-ref>.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes

**GitHub:**
- Check that your Authorization callback URL in GitHub exactly matches: `https://<project-ref>.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes

### "Invalid client" Error

- Double-check Client ID and Secret in Supabase Dashboard
- Make sure you copied the correct values (no extra spaces)
- For GitHub, make sure you generated a new client secret if needed

### OAuth Button Not Working

- Check browser console for errors
- Make sure OAuth providers are enabled in Supabase Dashboard
- Verify your Supabase project URL is correct

## Important Notes

- **Production Supabase**: No environment variables needed in your Next.js app - OAuth credentials are stored in Supabase Dashboard
- **Local Supabase**: You need `SUPABASE_AUTH_EXTERNAL_*` env vars in `.env.local` (but NOT in Vercel!)
- **Same credentials for dev and prod** - You can use the same OAuth apps for both
- **Callback URL is always Supabase** - Your app redirects to `/auth/callback`, which Supabase handles
- **Profile creation** - The `handle_new_user` trigger automatically creates a profile with 3 credits when users sign up via OAuth

## Security Best Practices

1. **Never commit OAuth secrets** - They're only in Supabase Dashboard
2. **Use different OAuth apps for dev/prod** - Optional but recommended
3. **Restrict OAuth apps** - In Google Cloud Console, you can restrict to specific domains
4. **Rotate secrets periodically** - Especially if compromised

## Next Steps

After setting up OAuth:
1. ✅ Test Google login
2. ✅ Test X.com login
3. ✅ Test GitHub login
4. ✅ Verify profile creation (users should get 3 credits on signup)
5. ✅ Test in production after deployment

