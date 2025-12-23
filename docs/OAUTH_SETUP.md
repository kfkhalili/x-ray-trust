# OAuth Setup Guide (Google & GitHub)

This guide explains how to set up Google and GitHub OAuth login for X-Ray Trust.

## Overview

OAuth credentials are configured in **Supabase Dashboard**, not in your code. You need to:
1. Create OAuth apps in Google Cloud Console and GitHub
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
   - App name: **X-Ray Trust** (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (default is fine)
   - Test users: Add your email if in testing mode
   - Click **Save and Continue** → **Back to Dashboard**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **X-Ray Trust Web Client**
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

## Step 2: GitHub OAuth Setup

### 2.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: X-Ray Trust (or your app name)
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

### 2.2 Add to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **GitHub** and click to expand
5. Toggle **Enable GitHub provider**
6. Enter:
   - **Client ID (for OAuth)**: Your GitHub Client ID
   - **Client Secret (for OAuth)**: Your GitHub Client Secret
7. Click **Save**

## Step 3: Configure Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL**: Your production URL (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 4: Test OAuth Login

1. Start your dev server: `npm run dev`
2. Click **Sign In** button
3. Click **Continue with Google** or **Continue with GitHub**
4. You should be redirected to the OAuth provider
5. After authorizing, you'll be redirected back and logged in

## Troubleshooting

### "Redirect URI mismatch" Error

**Google:**
- Check that your redirect URI in Google Cloud Console exactly matches: `https://<project-ref>.supabase.co/auth/v1/callback`
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

- **No environment variables needed** - OAuth credentials are stored in Supabase Dashboard
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
2. ✅ Test GitHub login
3. ✅ Verify profile creation (users should get 3 credits on signup)
4. ✅ Test in production after deployment

