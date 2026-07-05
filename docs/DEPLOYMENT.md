# Deployment

X Trust Radar is a stateless Next.js app with a single external dependency (a RapidAPI X data provider). There is no database, no auth, and no payment provider to configure.

## Prerequisites

1. A **RapidAPI** account with an active subscription to an X/Twitter API.
   - Default provider: [`twitter241`](https://rapidapi.com/davethebeast/api/twitter241). Open its **Pricing** tab and subscribe (the cheapest plan is enough for an MVP).
   - **Set a hard request limit / no overage** on the plan — this is your real billing protection (see "Billing protection" below).
   - Copy your key from the **Endpoints** tab (`X-RapidAPI-Key`).
2. A **Vercel** account (Hobby tier is fine).

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Add environment variables (Project → Settings → Environment Variables):

   ```
   RAPIDAPI_KEY=your_rapidapi_key
   # optional:
   # RAPIDAPI_HOST=twitter241.p.rapidapi.com      # only if you use a different X API
   # RAPIDAPI_MONTHLY_BUDGET=950                   # app-level cap on paid calls/month
   # NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. Deploy. Vercel builds with `next build` automatically.

## Verify the deployment

- `POST https://your-app.vercel.app/api/verify` with body `{"username":"elonmusk"}` → expect `200` with a trust report (`score`, `verdict`, `userInfo`).
- A nonexistent handle → `404` (`ACCOUNT_NOT_FOUND`).
- Missing/invalid key → `503` (`SERVER_ERROR`), logged as `RAPIDAPI_KEY is not configured` or an upstream `401/403`.

## Billing protection

The app has two app-level guards:

- **Per-IP rate limit** (10 lookups/hour) so one visitor can't drain your quota.
- **Monthly budget cap** (`RAPIDAPI_MONTHLY_BUDGET`, default 950) that stops paid calls before the plan quota and returns `503 SERVICE_AT_CAPACITY`.

**Important caveat:** these counters (and the 24h result cache) live in **process memory**. On Vercel's serverless runtime they reset on cold starts and are per-instance, so the monthly cap is best-effort, not a hard guarantee across a fleet.

The real guarantee against a surprise bill is on RapidAPI: ensure your plan has a **hard request limit with no overage** (or a spend cap). Then even in the worst case RapidAPI refuses requests beyond your quota instead of billing you.

For a durable, shared cache and a reliable global budget across instances, move the cache/counters to **Vercel KV** or **Upstash Redis** (a small change, isolated to `app/api/verify/route.ts`).

## Free-tier limits

- **Vercel (Hobby)**: unlimited deployments, 100 GB bandwidth/month.
- **RapidAPI**: depends on the plan you subscribe to on the chosen X API.
