# X-Ray Trust MVP

A Micro SaaS MVP that verifies the trustworthiness of X (Twitter) accounts using metadata analysis from `twitterapi.io`.

## Features

- **Trust Engine**: Pure functional scoring algorithm based on account age, listed count, and follower/following ratio
- **Credit System**: Pay-per-verification model with Stripe integration
- **Real-time Verification**: Instant trust score calculation with risk flag detection
- **Security-First UI**: Dark mode interface with emerald/amber/rose color palette

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Payments**: Stripe
- **Icons**: Lucide React
- **Type Safety**: Strict TypeScript (no `any`, no `unknown`)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for webhooks)
- `TWITTER_API_KEY`: Your twitterapi.io API key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `NEXT_PUBLIC_APP_URL`: Your application URL (e.g., `http://localhost:3000`)

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable email authentication in Supabase Dashboard

### 4. Stripe Setup

1. Create a Stripe account and get your API keys
2. Create Products and Prices in Stripe Dashboard for credit packs:
   - 50 Credits - $5
   - 120 Credits - $10
   - 250 Credits - $20
3. Update `lib/stripe.ts` with your actual Price IDs:
   ```typescript
   export const CREDIT_PACKS = new Map<string, number>([
     ['price_xxxxx', 50],   // Replace with actual Price ID
     ['price_yyyyy', 120],  // Replace with actual Price ID
     ['price_zzzzz', 250],  // Replace with actual Price ID
   ]);
   ```
4. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/webhook`
   - Events: `checkout.session.completed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Twitter API Setup

1. Sign up at [twitterapi.io](https://twitterapi.io)
2. Get your API key
3. Add it to `.env.local` as `TWITTER_API_KEY`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── verify/route.ts      # Trust verification endpoint
│   │   ├── checkout/route.ts    # Stripe checkout creation
│   │   └── webhook/route.ts     # Stripe webhook handler
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main landing page
│   └── globals.css               # Global styles
├── components/
│   ├── RadialProgress.tsx       # Trust score visualization
│   ├── TrustResults.tsx         # Results display component
│   └── CreditModal.tsx          # Credit purchase modal
├── lib/
│   ├── trust-engine.ts          # Pure functional trust calculation
│   ├── stripe.ts                # Stripe configuration
│   └── supabase/
│       ├── server.ts            # Server-side Supabase client
│       └── client.ts            # Client-side Supabase client
├── types/
│   └── trust.ts                 # Domain model types
└── supabase/
    └── schema.sql               # Database schema
```

## Trust Scoring Algorithm

The trust engine calculates scores using weighted components:

- **Account Age (40%)**: Newer accounts (< 30 days) are higher risk
- **Listed Count (30%)**: Best signal of human curation (bots rarely get listed)
- **Follower/Following Ratio (30%)**: Bots typically follow-back aggressively

Verdict thresholds:
- **TRUSTED**: Score ≥ 70
- **CAUTION**: Score 40-69
- **DANGER**: Score < 40

## Development Notes

- **Functional Programming**: All transformations use pure functions, immutability, and array methods (`.map()`, `.filter()`, `.reduce()`)
- **Type Safety**: Strict TypeScript with no `any` or `unknown` types
- **Comments**: Explain **WHY** logic choices were made, not **WHAT** the code does

## License

MIT

