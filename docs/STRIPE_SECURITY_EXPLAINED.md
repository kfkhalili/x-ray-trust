# Stripe Security: Why These Variables and Is It Safe?

## Why We Use These Two Variables

### 1. STRIPE_SECRET_KEY

**What it does:**

- Authenticates your server with Stripe's API
- Allows your server to create checkout sessions, verify payments, etc.
- Used in `lib/stripe.ts` to initialize the Stripe client

**Why we need it:**

- Without it, your server can't communicate with Stripe
- It proves to Stripe that requests are coming from your authorized server
- Required for all server-side Stripe operations

**Where it's used:**

```typescript
// lib/stripe.ts - Server-side only
const secretKey = process.env.STRIPE_SECRET_KEY;
stripeInstance = new Stripe(secretKey, { ... });
```

### 2. STRIPE_WEBHOOK_SECRET

**What it does:**

- Verifies that webhook events actually came from Stripe (not a malicious third party)
- Used to cryptographically verify webhook signatures
- Prevents attackers from sending fake "payment succeeded" events

**Why we need it:**

- **Security**: Without signature verification, anyone could POST fake payment events to your webhook
- **Attack prevention**: An attacker could send `{"type": "checkout.session.completed", "amount": 1000}` and grant themselves credits
- **Stripe's requirement**: Stripe recommends (and we require) signature verification

**Where it's used:**

```typescript
// app/api/webhook/route.ts - Server-side only
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const event = stripe().webhooks.constructEvent(body, signature, webhookSecret);
// If signature doesn't match, this throws an error - webhook is rejected
```

## Is It Secure to Name Them This Way in Vercel?

**Yes, it's completely secure.** Here's why:

### 1. Environment Variable Names Are Not Secret

- **The names** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are just labels
- They're not exposed to the client or in your code
- They're only used internally by your server
- **The values** (the actual keys) are what need to be secret

### 2. Server-Side Only

- These variables are accessed via `process.env` in **server-side code only**
- Next.js **never** exposes `process.env` variables to the browser (unless they start with `NEXT_PUBLIC_`)
- Your API routes (`/api/checkout`, `/api/webhook`) run on the server
- The client never sees these values

### 3. Vercel Security

- **Encryption at rest**: Vercel encrypts environment variables when stored
- **Encryption in transit**: Variables are encrypted when sent to your serverless functions
- **Access control**: Only you (and team members you grant access) can see/edit them
- **No exposure**: Vercel never exposes environment variables in client-side code

### 4. Standard Practice

- Using descriptive names like `STRIPE_SECRET_KEY` is **industry standard**
- Everyone does it this way (Stripe's own documentation recommends it)
- It makes your code readable and maintainable
- Security comes from protecting the **values**, not hiding the **names**

## Security Best Practices (What Actually Matters)

### ✅ What You Should Do

1. **Protect the values** (the actual keys):

   - Never commit them to git (already in `.gitignore`)
   - Never share them publicly
   - Never log them in your code
   - Rotate them if compromised

2. **Use environment variables**:

   - Store in Vercel (encrypted)
   - Use `.env.local` for local dev (gitignored)
   - Never hardcode in your source code

3. **Verify webhook signatures**:

   - Always verify webhook signatures (we do this)
   - Reject webhooks with invalid signatures (we do this)

4. **Use HTTPS**:
   - Vercel automatically uses HTTPS
   - Webhooks must use HTTPS (Stripe requirement)

### ❌ What Doesn't Matter for Security

- The **name** of the environment variable (`STRIPE_SECRET_KEY` vs `STRIPE_KEY` vs `MY_SECRET`)
- Whether the name is "obvious" or not
- Using generic names vs descriptive names

## How Next.js Protects Environment Variables

### Server-Side Variables (Secure)

```typescript
// ✅ SECURE - Server-side only
process.env.STRIPE_SECRET_KEY; // Only available in API routes, server components
process.env.STRIPE_WEBHOOK_SECRET; // Never sent to browser
process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**These are:**

- Only available in server-side code (API routes, Server Components)
- Never included in the client bundle
- Never accessible from the browser
- Safe to use with descriptive names

### Client-Side Variables (Public)

```typescript
// ⚠️ PUBLIC - Sent to browser
process.env.NEXT_PUBLIC_SUPABASE_URL; // Included in client bundle
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Anyone can see this
process.env.NEXT_PUBLIC_APP_URL;
```

**These are:**

- Prefixed with `NEXT_PUBLIC_` to indicate they're public
- Included in the JavaScript bundle sent to browsers
- Visible to anyone who inspects your code
- Should only contain non-sensitive values

## Real-World Example

### What an Attacker Could Do

**Without webhook signature verification:**

```bash
# Attacker sends fake webhook
curl -X POST https://your-app.com/api/webhook \
  -d '{"type": "checkout.session.completed", "amount": 10000}'
# Your server grants 10,000 credits! 💥
```

**With webhook signature verification (what we do):**

```bash
# Attacker sends fake webhook
curl -X POST https://your-app.com/api/webhook \
  -d '{"type": "checkout.session.completed", "amount": 10000}'
# Your server verifies signature → Invalid → Rejected ✅
```

### What an Attacker Cannot Do

- ❌ Access `process.env.STRIPE_SECRET_KEY` from the browser (doesn't exist there)
- ❌ See environment variables in your source code (they're not in git)
- ❌ Access Vercel's environment variable storage (requires your login)
- ❌ Send valid webhook signatures (only Stripe knows the secret)

## Summary

**Is it secure to name them `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel?**

✅ **Yes, absolutely secure.**

- Variable names are just labels (not secrets)
- Values are encrypted and server-side only
- Vercel follows industry security standards
- This is standard practice across the industry
- Security comes from protecting values, not hiding names

**What actually matters for security:**

1. ✅ Never commit secrets to git
2. ✅ Use environment variables (not hardcoded)
3. ✅ Verify webhook signatures (we do this)
4. ✅ Use HTTPS (Vercel does this automatically)
5. ✅ Rotate keys if compromised

**What doesn't matter:**

- ❌ The name of the environment variable
- ❌ Whether the name is "obvious" or not
- ❌ Using generic vs descriptive names

You're following all the right security practices! 🔒
