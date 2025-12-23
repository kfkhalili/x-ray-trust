# API Key Troubleshooting

## "Invalid API key" Error

If you're seeing "invalid api key" or "401 Unauthorized" errors when trying to authenticate, check the following:

### 1. Verify Your API Key in Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Check `NEXT_PUBLIC_SUPABASE_ANON_KEY`**:
   - Should be either:
     - **Legacy anon key** (JWT format, starts with `eyJ...`)
     - **Publishable key** (starts with `sb_publishable_...`)
3. **Verify it matches** what's in your Supabase Dashboard

### 2. Get the Correct Key from Supabase

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Select your project**
3. **Navigate to**: Settings → API
4. **Find your keys**:
   - **Legacy anon key**: Under "Project API keys" → `anon` `public` (JWT format)
   - **Publishable key**: Under "Publishable keys" → `default` (format: `sb_publishable_...`)

### 3. Update Vercel Environment Variable

1. **Copy the correct key** from Supabase Dashboard
2. **Go to Vercel** → Your Project → Settings → Environment Variables
3. **Update `NEXT_PUBLIC_SUPABASE_ANON_KEY`** with the correct value
4. **Redeploy** your application

### 4. Which Key Should You Use?

Both keys work, but:
- **Publishable keys** (`sb_publishable_...`) are recommended for new projects
- **Legacy anon keys** (JWT format) still work but are being phased out
- **Either will work** - just make sure you use the same one consistently

### 5. Common Issues

**Issue**: "I see a different publishable key in the request than in Supabase"
- **Solution**: Your Vercel environment variable has an old/incorrect key. Update it to match Supabase.

**Issue**: "The key works locally but not in production"
- **Solution**: Check that Vercel has the correct environment variable set (not just `.env.local`)

**Issue**: "I rotated my keys but it's still not working"
- **Solution**: Make sure you updated the environment variable in Vercel and redeployed

### 6. Verify It's Working

After updating the key:
1. **Redeploy** your Vercel application
2. **Try logging in** with email or OAuth
3. **Check browser console** - should not see "invalid api key" errors
4. **Check Network tab** - the `apikey` header should match your Supabase key

## Getting Your Keys

### From Supabase Dashboard

1. Go to: https://app.supabase.com/project/_/settings/api
2. Find:
   - **Legacy anon key**: Under "Project API keys" → `anon` `public`
   - **Publishable key**: Under "Publishable keys" → `default`

### Using Supabase MCP (if available)

The MCP tools can also retrieve your keys programmatically.

## Security Notes

- ✅ **Safe to expose**: Both anon and publishable keys are safe to expose in client-side code
- ❌ **Never expose**: Service role keys or secret keys (`sb_secret_...`)
- 🔒 **Protect with RLS**: Always use Row Level Security (RLS) policies to protect your data

