# OAuth Production Setup Checklist

## Quick Verification Steps

If you're getting "provider is not enabled" error with **production Supabase**, follow this checklist:

### Step 1: Verify Supabase Dashboard Configuration

1. **Go to**: https://app.supabase.com/
2. **Select the correct project** (double-check you're in the right one!)
3. **Navigate to**: Authentication → **Providers**
4. **Find "Google"** and click to expand

### Step 2: Check These Settings

- [ ] **Toggle is ON** - "Enable Google provider" should be enabled/green
- [ ] **Client ID is filled** - Should have a value (not empty)
- [ ] **Client Secret is filled** - Should have a value (not empty)
- [ ] **You clicked "Save"** - Changes don't apply until you save!

### Step 3: If Settings Look Correct But Still Not Working

1. **Disable and re-enable**:
   - Toggle "Enable Google provider" OFF
   - Click "Save"
   - Wait 10 seconds
   - Toggle "Enable Google provider" ON
   - Click "Save" again

2. **Verify credentials are correct**:
   - Go to Google Cloud Console
   - Check that your OAuth Client ID matches what's in Supabase
   - Regenerate Client Secret if needed (then update in Supabase)

3. **Check redirect URI**:
   - In Google Cloud Console, verify redirect URI is: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Find your project ref in Supabase Dashboard → Settings → API → Project URL

4. **Clear browser cache** and try again

### Step 4: Verify Redirect URL Configuration

In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. **Site URL** should be set (e.g., `https://www.xtrustradar.com` or your Vercel URL)
3. **Redirect URLs** should include:
   - `https://www.xtrustradar.com/auth/callback` (or your production URL)
   - `http://localhost:3000/auth/callback` (for local testing)

### Step 5: Test Again

1. **Wait 30 seconds** after saving (for changes to propagate)
2. **Clear browser cache** or use incognito mode
3. **Try logging in with Google** again
4. **Check browser console** for any additional error messages

## Still Not Working?

### Check Browser Console

Open browser DevTools (F12) → Console tab, and look for:
- Any JavaScript errors
- Network errors
- Additional error messages from Supabase

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs → API Logs
2. Look for authentication errors around the time you tried to log in
3. Check for any error messages related to OAuth

### Verify Project URL

Make sure your `.env.local` or Vercel environment variables have the correct Supabase URL:
- Check `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL
- Should look like: `https://abcdefghijklmnop.supabase.co`

### Common Issues

**Issue**: "I enabled it but it's still not working"
- **Solution**: Make sure you clicked "Save" after enabling
- **Solution**: Wait 30 seconds for changes to propagate
- **Solution**: Try disabling and re-enabling

**Issue**: "The toggle is on but fields are empty"
- **Solution**: You need to add Client ID and Secret, then click Save

**Issue**: "I'm in the wrong Supabase project"
- **Solution**: Double-check you're in the project that matches your `NEXT_PUBLIC_SUPABASE_URL`

**Issue**: "Redirect URI mismatch"
- **Solution**: In Google Cloud Console, add: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- **Solution**: Make sure there are no trailing slashes

## Need More Help?

See detailed setup guide: `docs/OAUTH_SETUP.md`
See troubleshooting guide: `docs/OAUTH_TROUBLESHOOTING.md`

