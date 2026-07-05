# Vercel Deployment Checklist

Quick reference for deploying X Trust Radar to Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

## Pre-Deployment

### 1. RapidAPI

- [ ] Create a [RapidAPI](https://rapidapi.com) account
- [ ] Subscribe to an X/Twitter API (default: [`twitter241`](https://rapidapi.com/davethebeast/api/twitter241) → Pricing → subscribe)
- [ ] **Set a hard request limit / no overage** on the plan (billing protection)
- [ ] Copy your `X-RapidAPI-Key`

### 2. Code

- [ ] `npm run test` passes
- [ ] `npx tsc --noEmit` is clean
- [ ] Repo pushed to GitHub

## Deploy

- [ ] Import the repo into Vercel
- [ ] Add environment variables:
  - [ ] `RAPIDAPI_KEY` (required)
  - [ ] `RAPIDAPI_HOST` (optional — only if not using `twitter241`)
  - [ ] `RAPIDAPI_MONTHLY_BUDGET` (optional — default 950)
  - [ ] `NEXT_PUBLIC_APP_URL` (optional)
- [ ] Deploy

## Post-Deployment

- [ ] `POST /api/verify {"username":"elonmusk"}` → `200` with a trust report
- [ ] Nonexistent handle → `404 ACCOUNT_NOT_FOUND`
- [ ] Homepage loads, search works, no console errors
- [ ] Confirm the RapidAPI dashboard shows the plan's hard limit is active

## Notes

- No database, auth, or payment setup is required — the app is stateless.
- The in-memory cache / rate limit / monthly budget reset per serverless instance; for durable behavior move them to Vercel KV or Upstash. Your RapidAPI hard limit is the authoritative billing cap.
