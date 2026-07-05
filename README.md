# X Trust Radar

A free, stateless tool that verifies the trustworthiness of X (Twitter) accounts using behavioral signals and metadata analysis.

## Why X Trust Radar?

Social media impersonation and bot accounts are increasingly sophisticated. Traditional verification badges (Blue checkmarks) can be purchased, making them unreliable trust signals. X Trust Radar analyzes behavioral patterns that are difficult for bots to fake: account longevity, organic follower growth, genuine engagement, and human curation (being added to lists).

## Tech Stack

- **Next.js 16** — App Router with React 19
- **Tailwind CSS 4** — Utility-first styling
- **RapidAPI** — X account metadata source (default: [`twitter241`](https://rapidapi.com/davethebeast/api/twitter241))
- **Jest** — Unit testing

No database, no accounts, no payments. The app is stateless: a lookup fetches public X data, scores it with a pure function, caches the result in memory for 24 hours, and returns it.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and add your RapidAPI key
cp .env.example .env.local
# edit .env.local → set RAPIDAPI_KEY

# Run development server
npm run dev
```

To get a key: create a [RapidAPI](https://rapidapi.com) account and **subscribe** to an X/Twitter API (the default is [`twitter241`](https://rapidapi.com/davethebeast/api/twitter241) — its cheapest plan is enough for an MVP). Each API on RapidAPI requires its own subscription even on the free tier.

## Environment Setup

See `.env.example`. Only one variable is required:

| Variable                  | Required | Purpose                                                             |
| ------------------------- | -------- | ------------------------------------------------------------------- |
| `RAPIDAPI_KEY`            | yes      | Your RapidAPI key (`X-RapidAPI-Key`)                                |
| `RAPIDAPI_HOST`           | no       | Override the X API host (default `twitter241.p.rapidapi.com`)       |
| `RAPIDAPI_MONTHLY_BUDGET` | no       | Cap on paid upstream calls per month (default `950`)                |
| `NEXT_PUBLIC_APP_URL`     | no       | App URL (defaults to `http://localhost:3000`)                       |

## How It Works

1. `POST /api/verify { "username": "..." }`
2. **Cache** — a fresh (<24h) in-memory result is returned immediately, with no upstream call.
3. **Rate limit** — each IP is capped (10 lookups/hour) so no single visitor can drain your quota.
4. **Budget guard** — a monthly cap (`RAPIDAPI_MONTHLY_BUDGET`, default 950) stops calls before the plan quota is hit; over budget returns `503 SERVICE_AT_CAPACITY` without calling the API.
5. **Fetch → score → cache** — public account data is fetched via RapidAPI, scored by the trust engine, cached, and returned.

> The cache, rate limit, and budget counters live in process memory. That's fine for an MVP, but on a serverless host they reset on cold starts and are per-instance — for a durable, shared cache use Vercel KV / Upstash, and rely on your RapidAPI plan's hard request limit for guaranteed billing protection.

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

- **Automated accounts**: If the `is_automated` flag is present and true, score is capped at 15 (DANGER)
- **Missing data**: Factors default to neutral (50) when data is unavailable, with reduced confidence

## Project Structure

```
├── app/
│   ├── api/
│   │   └── verify/        # Trust verification endpoint (fetch + cache + rate limit + budget)
│   ├── page.tsx           # Main search interface
│   ├── privacy|terms|cookies/  # Static legal pages
│   └── globals.css        # Tailwind v4 imports
├── components/
│   ├── TrustResults.tsx   # Full results display
│   ├── RadialProgress.tsx # Animated score circle
│   ├── ScoreBreakdown.tsx # Factor-by-factor analysis
│   ├── UserDetails.tsx    # Profile card
│   ├── Footer.tsx
│   └── CookieBanner.tsx
├── lib/
│   ├── trust-engine.ts    # Pure scoring functions
│   ├── fetch-utils.ts     # Client-side fetch (Result types)
│   ├── validation.ts      # Type guards
│   └── __tests__/         # Unit tests
└── types/
    └── trust.ts           # Domain types
```

## Development

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Deployment

Deploys to Vercel with a single environment variable. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) and the [Vercel checklist](./docs/VERCEL_DEPLOYMENT_CHECKLIST.md).

Short version: import the repo into Vercel, set `RAPIDAPI_KEY` (and make sure your RapidAPI plan has a hard request limit so you can't be billed for overage), deploy.

## Design Principles

- **Pure Functions**: Trust calculations are stateless transformations
- **Immutability**: All data types use `readonly` modifiers
- **Type Safety**: Strict TypeScript, no `any` or type assertions in domain code
- **Why-First Comments**: Comments explain reasoning, not mechanics

## License

MIT
