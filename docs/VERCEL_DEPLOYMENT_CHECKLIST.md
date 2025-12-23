# Vercel Deployment Checklist

Quick reference for deploying X-Ray Trust to Vercel.

## Pre-Deployment Checklist

### 1. Supabase Setup ✅

- [ ] Create Supabase project (or use existing)
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Copy credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Stripe Setup (Test Mode First)

- [ ] Create 3 products in Stripe Dashboard (Test Mode):
  - **Basic Pack - 50 Credits (€4.99)**: "Perfect for trying out X-Ray Trust. Verify 50 Twitter accounts and discover who you can trust."
  - **Popular Pack - 100 Credits (€9.99)**: "Most popular choice! Double the credits for the same price per credit. Verify 100 Twitter accounts."
  - **Pro Pack - 250 Credits (€19.99)**: "For power users and businesses. Verify 250 Twitter accounts and save 20% compared to smaller packs."
- [ ] Copy Price IDs (start with `price_...`)
- [ ] Update `lib/stripe.ts` with Price IDs
- [ ] Commit and push to GitHub
- [ ] Copy `STRIPE_SECRET_KEY` (test key: `sk_test_...`)

### 3. Twitter API

- [ ] Get API key from https://twitterapi.io
- [ ] Copy `TWITTER_API_KEY`

### 4. GitHub

- [ ] Push all commits to GitHub
- [ ] Verify repository is up to date

## Vercel Deployment Steps

### Step 1: Connect Repository

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import `kfkhalili/x-ray-trust` from GitHub
4. Vercel auto-detects Next.js ✅

### Step 2: Environment Variables

Add these in Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
TWITTER_API_KEY=your_twitterapi_io_key
STRIPE_SECRET_KEY=sk_test_... (use test key first!)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app (update after first deploy)
```

**Note:** Don't add `STRIPE_WEBHOOK_SECRET` yet—you need the Vercel URL first.

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build (~2-3 minutes)
3. Copy your Vercel URL (e.g., `x-ray-trust.vercel.app`)

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Enter: `https://your-app.vercel.app/api/webhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`)
6. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
7. Redeploy (or wait for auto-redeploy)

### Step 5: Update App URL

1. Update `NEXT_PUBLIC_APP_URL` in Vercel with your actual URL
2. Redeploy

## Testing After Deployment

### Test Checklist

- [ ] Visit Vercel URL - page loads
- [ ] Try 3 free lookups (unauthenticated)
- [ ] Sign in with email magic link
- [ ] Verify a Twitter account (should deduct credit)
- [ ] Click "Buy Credits" - modal opens
- [ ] Test checkout with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify credits added after payment
- [ ] Check Stripe Dashboard - payment received
- [ ] Check Stripe Webhooks - event received

## Common Issues

### Build Fails

- Check environment variables are set
- Verify TypeScript compiles locally: `npm run build`
- Check Vercel build logs

### Webhook Not Working

- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe
- Test with Stripe CLI locally first

### Authentication Not Working

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify email is configured in Supabase

### Payments Not Working

- Verify Price IDs in `lib/stripe.ts` match Stripe
- Check Stripe keys are for correct environment (test vs live)
- Verify webhook is receiving events

## Going Live (After Testing)

1. Switch Stripe to **Live Mode**
2. Create products again in Live Mode
3. Update `lib/stripe.ts` with Live Price IDs
4. Update `STRIPE_SECRET_KEY` to live key (`sk_live_...`)
5. Update webhook to use live webhook secret
6. Test with real card (small amount)
7. Monitor Stripe Dashboard

## Quick Reference

**Environment Variables Needed:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWITTER_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (after first deploy)
- `NEXT_PUBLIC_APP_URL` (update after first deploy)

**Stripe Test Card:**

- Card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

**Support Docs:**

- Full deployment: `docs/DEPLOYMENT.md`
- Stripe setup: `docs/STRIPE_SETUP_GUIDE.md`
- German launch: `docs/GERMAN_LAUNCH_GUIDE.md`
