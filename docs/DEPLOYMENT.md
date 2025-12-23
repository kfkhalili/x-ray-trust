# Deployment Guide: Vercel + Supabase (Free Tier)

This guide walks you through deploying X Trust Radar to production using free tiers of Vercel and Supabase.

## Prerequisites

- GitHub account (code is already pushed)
- Vercel account (free tier)
- Supabase account (free tier)
- Stripe account (for payments)

## Step 1: Deploy Supabase Database

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and name it `xtrustradar`
4. Set database password (save this!)
5. Choose region closest to your users
6. Wait for project to initialize (~2 minutes)

### 1.2 Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/schema.sql`
3. Paste and run in SQL Editor
4. Verify `profiles` table was created

### 1.3 Get Supabase Credentials

1. Go to Project Settings → API
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Step 2: Configure Stripe

### 2.1 Create Products & Prices

1. Go to Stripe Dashboard → Products
2. Create 3 products:
   - **50 Credits** - €4.99 (one-time payment)
   - **100 Credits** - €9.99 (one-time payment)
   - **250 Credits** - €19.99 (one-time payment)
3. Copy the **Price IDs** (start with `price_...`)

### 2.2 Update Code with Price IDs

Edit `lib/stripe.ts`:

```typescript
export const CREDIT_PACKS = new Map<string, number>([
  ['price_YOUR_50_CREDITS_ID', 50],   // €4.99
  ['price_YOUR_100_CREDITS_ID', 100], // €9.99
  ['price_YOUR_250_CREDITS_ID', 250], // €19.99
]);
```

Commit and push to GitHub.

### 2.3 Get Stripe Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy:
   - `Secret key` (starts with `sk_...`) → `STRIPE_SECRET_KEY`
   - Keep this for Step 3

### 2.4 Set Up Webhook (After Vercel Deployment)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your Vercel URL: `https://your-app.vercel.app/api/webhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub: `kfkhalili/xtrustradar`
4. Vercel will auto-detect Next.js

### 3.2 Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
TWITTER_API_KEY=your_twitterapi_io_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (add after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**:
- Use `sk_live_...` for production (or `sk_test_...` for testing)
- Add `STRIPE_WEBHOOK_SECRET` after first deployment (you need the Vercel URL first)

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Copy your Vercel URL (e.g., `xtrustradar.vercel.app`)

### 3.4 Update Webhook URL

1. Go back to Stripe Dashboard → Webhooks
2. Update webhook endpoint with your Vercel URL
3. Copy the new signing secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
5. Redeploy (or wait for auto-redeploy)

## Step 4: Configure Twitter API

1. Get API key from https://twitterapi.io
2. Add to Vercel environment variables as `TWITTER_API_KEY`
3. Redeploy if needed

## Step 5: Verify Deployment

### 5.1 Test Authentication

1. Visit your Vercel URL
2. Click "Sign In"
3. Enter email, check for magic link
4. Verify you can log in

### 5.2 Test Verification

1. Try verifying a Twitter account (e.g., `elonmusk`)
2. Verify you see results
3. Check that credits were deducted

### 5.3 Test Payments (Test Mode)

1. Click "Buy Credits"
2. Select a pack
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify credits were added

## Step 6: Enable Free Tier (Optional)

To add 3 free verifications on signup, update the webhook handler or add a migration:

```sql
-- Add free_verifications_used column
ALTER TABLE profiles ADD COLUMN free_verifications_used INTEGER DEFAULT 0;

-- Give new users 3 free verifications
-- This can be done in a trigger or in the signup flow
```

Then update `app/api/verify/route.ts` to check for free verifications before charging.

## Troubleshooting

### Build Fails

- Check environment variables are set correctly
- Verify TypeScript compiles: `npm run build` locally
- Check Vercel build logs for specific errors

### Webhook Not Working

- Verify webhook URL is correct in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe's signing secret
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

### Database Errors

- Verify RLS policies are enabled
- Check service role key is correct
- Verify `profiles` table exists and has correct schema

### Payments Not Working

- Verify Price IDs are correct in `lib/stripe.ts`
- Check Stripe keys are for correct environment (test vs live)
- Verify webhook is receiving events (check Stripe Dashboard → Webhooks → Events)

## Free Tier Limits

### Vercel (Hobby Plan - Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ⚠️ Serverless function execution time limits

### Supabase (Free Tier)
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ⚠️ 2 projects max

### Stripe
- ✅ No monthly fees
- ✅ 2.9% + $0.30 per transaction
- ✅ Test mode unlimited

## Cost Estimate (100 Users/Month)

- **Vercel**: $0 (free tier)
- **Supabase**: $0 (free tier)
- **Stripe**: ~$0.30 per transaction (only if users pay)
- **twitterapi.io**: Check their pricing
- **Total**: ~$0-30/month depending on usage

## Next Steps

1. ✅ Deploy to production
2. ✅ Test all flows
3. ✅ Share on LinkedIn/Twitter
4. ✅ Monitor usage and errors
5. ✅ Gather user feedback
6. ✅ Iterate based on feedback

---

**Deployment Checklist**:
- [ ] Supabase project created
- [ ] Database schema run
- [ ] Stripe products created
- [ ] Price IDs added to code
- [ ] Vercel project deployed
- [ ] Environment variables configured
- [ ] Webhook configured
- [ ] Authentication tested
- [ ] Verification tested
- [ ] Payments tested (test mode)
- [ ] Production ready! 🚀

