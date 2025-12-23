# What Supabase is Used For in X-Ray Trust

## Overview

Supabase is used for **two main things**:
1. **User Authentication** (email magic links)
2. **Credit Balance Storage** (one simple table)

## 1. Authentication

**What it does:**
- Users sign in with email magic links (no passwords)
- Supabase handles email sending, token generation, session management
- Provides `auth.users` table automatically

**Where it's used:**
- `components/AuthButton.tsx` - Sign in/out UI
- `app/page.tsx` - Check if user is logged in
- `app/api/verify/route.ts` - Check authentication before charging credits
- `app/api/checkout/route.ts` - Require authentication to purchase credits

## 2. Credit Balance Storage

**What it does:**
- Stores user credit balances in a `profiles` table
- One row per user with their credit count

**Database Schema:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  credits INTEGER NOT NULL DEFAULT 3,  -- The main thing!
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**What happens:**
1. **User signs up** → Profile automatically created with 3 credits (via trigger)
2. **User verifies account** → Credits deducted (1 credit per verification)
3. **User buys credits** → Credits added via Stripe webhook
4. **User views dashboard** → Credits displayed from this table

## Why It Looks "Empty"

**It's minimal by design:**
- Only **one custom table** (`profiles`)
- Only stores **credit balances** (and email for convenience)
- No complex data - just credits per user
- Everything else (auth, sessions) is handled by Supabase automatically

**What you'll see in Supabase Dashboard:**
- `auth.users` table (automatic - Supabase manages this)
- `profiles` table (your custom table - just credits)
- That's it!

## How Credits Flow

### Credit Deduction (When User Verifies)
1. User verifies a Twitter account
2. `app/api/verify/route.ts` checks credits: `SELECT credits FROM profiles WHERE id = user.id`
3. If credits > 0, deduct: `UPDATE profiles SET credits = credits - 1`
4. Return trust report

### Credit Addition (When User Pays)
1. User completes Stripe checkout
2. Stripe sends webhook to `/api/webhook`
3. Webhook verifies signature (proves payment is real)
4. Webhook uses **service role key** to bypass RLS
5. Adds credits: `UPDATE profiles SET credits = credits + purchased_amount`

## Row Level Security (RLS)

**Why it matters:**
- Users can only see/update their own profile
- Prevents users from modifying other users' credits
- Service role key bypasses RLS (only for webhooks)

**Policies:**
- Users can SELECT their own profile
- Users can UPDATE their own profile
- That's it - simple and secure

## Summary

**Supabase provides:**
- ✅ User authentication (email magic links)
- ✅ One table: `profiles` with credit balances
- ✅ Automatic profile creation on signup
- ✅ Row Level Security (users can't see others' credits)
- ✅ Service role access for webhooks

**That's it!** It's intentionally simple. The "empty" feeling is because we're only storing credit balances - no complex user data, no analytics tables, no history. Just credits.

## What You Need to Set Up

1. **Create Supabase project** (if not done)
2. **Run `supabase/schema.sql`** in SQL Editor (creates `profiles` table)
3. **Get credentials:**
   - Project URL
   - Anon key (public)
   - Service role key (secret - for webhooks)

That's all you need!

