# Stripe Webhook Configuration Guide

## Destination Name and Description

When setting up your Stripe webhook endpoint, you'll see fields for:

### Destination Name

**What it is:** A label to identify this webhook in your Stripe Dashboard.

**Recommendations:**
- `xtrustradar-production` - Clear and descriptive
- `xtrustradar-webhook` - Simple alternative
- `x-trust-radar-prod` - If you prefer hyphens

**Why it matters:**
- You might have multiple webhooks (test, production, staging)
- Makes it easy to identify which webhook is which
- Only visible to you in Stripe Dashboard (not security-sensitive)

**Example:**
```
Destination name: xtrustradar-production
```

### Description (Optional)

**What it is:** A longer description of what this webhook does.

**Recommendations:**
- `X Trust Radar production webhook - grants credits after successful payment`
- `Production webhook for X Trust Radar - processes checkout.session.completed events`
- `Grants user credits when payment is completed`

**Why it's useful:**
- Helps you remember what each webhook does
- Useful if you have multiple webhooks
- Makes troubleshooting easier
- Optional but recommended

**Example:**
```
Description: X Trust Radar production webhook - grants credits after successful payment
```

## Complete Configuration Example

When setting up your webhook, use these values:

**Destination name:**
```
xtrustradar-production
```

**Endpoint URL:**
```
https://www.xtrustradar.com/api/webhook
```

**Description:**
```
X Trust Radar production webhook - grants credits after successful payment
```

**Events:**
- ✅ `checkout.session.completed`

**API Version:**
- `2025-12-15.clover` (Stripe will auto-select this)

## Important Notes

### Destination Name
- ✅ Can be changed later
- ✅ Not security-sensitive (just a label)
- ✅ Only visible to you
- ✅ Use descriptive names for clarity

### Description
- ✅ Optional but recommended
- ✅ Can be changed later
- ✅ Helps with organization
- ✅ Not security-sensitive

### What Actually Matters
- ✅ **Endpoint URL** - Must be correct and publicly accessible
- ✅ **Events** - Must include `checkout.session.completed`
- ✅ **Signing secret** - Must be copied and added to Vercel env vars

## Multiple Environments

If you have multiple environments, use different names:

**Production:**
- Destination name: `xtrustradar-production`
- Endpoint URL: `https://www.xtrustradar.com/api/webhook`

**Staging/Preview:**
- Destination name: `xtrustradar-staging`
- Endpoint URL: `https://xtrustradar-staging.vercel.app/api/webhook`

**Test Mode:**
- Destination name: `xtrustradar-test`
- Endpoint URL: `https://localhost:3000/api/webhook` (with Stripe CLI)

This makes it easy to identify which webhook is which in your Stripe Dashboard.

