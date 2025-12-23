# X Trust Radar

A Micro SaaS that verifies the trustworthiness of X (Twitter) accounts using behavioral signals and metadata analysis.

## Why X Trust Radar?

Social media impersonation and bot accounts are increasingly sophisticated. Traditional verification badges (Blue checkmarks) can be purchased, making them unreliable trust signals. X Trust Radar analyzes behavioral patterns that are difficult for bots to fake: account longevity, organic follower growth, genuine engagement, and human curation (being added to lists).

## Tech Stack

- **Next.js 16** — App Router with React 19
- **Tailwind CSS 4** — Utility-first styling
- **Supabase** — Auth & PostgreSQL with RLS
- **Stripe** — Credit-based payment system
- **twitterapi.io** — X account metadata source
- **Jest** — Unit testing

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start local Supabase (requires Docker)
npx supabase start

# Run development server
npm run dev
```

## Environment Setup

See `.env.example` for required variables:

| Variable                        | Purpose                           |
| ------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side operations (webhooks) |
| `TWITTER_API_KEY`               | twitterapi.io API key             |
| `STRIPE_SECRET_KEY`             | Stripe server key                 |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook signing            |
| `NEXT_PUBLIC_APP_URL`           | App URL for redirects             |

## Trust Scoring Algorithm

The scoring engine uses **5 behavioral signals** weighted by their reliability in detecting fake accounts:

| Signal             | Weight | Why This Weight                                           |
| ------------------ | ------ | --------------------------------------------------------- |
| **Account Age**    | 25%    | New accounts are higher risk—building history takes time  |
| **Follower Ratio** | 25%    | Bots follow aggressively; organic accounts earn followers |
| **Activity**       | 25%    | Real users tweet; dormant accounts are suspicious         |
| **Engagement**     | 15%    | Likes and media indicate genuine platform usage           |
| **Listed Count**   | 10%    | Human curation signal (when available)                    |

### Verdict Thresholds

- **TRUSTED** (≥70): Strong positive signals across multiple factors
- **CAUTION** (40-69): Mixed signals, proceed with care
- **DANGER** (<40): Multiple red flags detected

### Special Cases

- **Automated accounts**: If `is_automated` flag is true, score is capped at 15 (DANGER)
- **Missing data**: Factors default to neutral (50) when data is unavailable, with reduced confidence

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── verify/       # Trust verification endpoint
│   │   ├── checkout/     # Stripe checkout creation
│   │   └── webhook/      # Stripe webhook handler
│   ├── page.tsx          # Main search interface
│   └── globals.css       # Tailwind v4 imports
├── components/
│   ├── TrustResults.tsx  # Full results display
│   ├── RadialProgress.tsx# Animated score circle
│   ├── ScoreBreakdown.tsx# Factor-by-factor analysis
│   ├── UserDetails.tsx   # Profile card
│   ├── CreditModal.tsx   # Purchase modal
│   └── AuthButton.tsx    # Login/logout
├── lib/
│   ├── trust-engine.ts   # Pure scoring functions
│   ├── stripe.ts         # Stripe config
│   ├── supabase/
│   │   ├── server.ts     # Server client (async cookies)
│   │   ├── client.ts     # Browser client
│   │   └── admin.ts      # Service role client
│   └── __tests__/        # Unit tests
├── types/
│   └── trust.ts          # Domain types
├── scripts/
│   └── add-credits.ts    # Dev utility: add credits to user
└── supabase/
    └── schema.sql        # Database schema
```

## Development

### Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Adding Credits (Dev)

```bash
npx tsx scripts/add-credits.ts user@example.com 100
```

### Local Stripe Webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## Deployment

### Quick Deploy to Vercel + Supabase

1. **Set up Supabase**:
   - Create project at https://supabase.com
   - Run `supabase/schema.sql` in SQL Editor
   - Copy credentials from Project Settings → API

2. **Configure Stripe**:
   - Create products in Stripe Dashboard (50, 120, 250 credits)
   - Copy Price IDs and update `lib/stripe.ts`
   - Get API keys from Developers → API keys

3. **Deploy to Vercel**:
   - Import GitHub repository
   - Add environment variables (see `.env.example`)
   - Deploy and get your URL

4. **Set up Webhook**:
   - Add webhook endpoint in Stripe: `https://your-app.vercel.app/api/webhook`
   - Select event: `checkout.session.completed`
   - Copy signing secret to Vercel env vars

5. **Configure Twitter API**:
   - Get key from https://twitterapi.io
   - Add to Vercel environment variables

### Environment Variables

Add these to Vercel (or `.env.local` for local dev):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
TWITTER_API_KEY=your_twitterapi_io_key
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (after webhook setup)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Testing Deployment

1. **Authentication**: Sign in with email magic link, Google, or GitHub OAuth
2. **Verification**: Try verifying a Twitter account (3 free per IP)
3. **Payments**: Test with Stripe test card `4242 4242 4242 4242`

### OAuth Setup (Google & GitHub)

See [docs/OAUTH_SETUP.md](./docs/OAUTH_SETUP.md) for detailed instructions on setting up Google and GitHub OAuth login. OAuth credentials are configured in Supabase Dashboard, not in environment variables.

### Free Tier Limits

- **Vercel (Hobby)**: Unlimited deployments, 100GB bandwidth/month
- **Supabase (Free)**: 500MB database, 2GB bandwidth, 50K MAU
- **Stripe**: 2.9% + $0.30 per transaction (no monthly fees)

For detailed deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Design Principles

- **Pure Functions**: Trust calculations are stateless transformations
- **Immutability**: All data types use `readonly` modifiers
- **Type Safety**: Strict TypeScript, no `any` or type assertions
- **Why-First Comments**: Comments explain reasoning, not mechanics

## License

MIT
