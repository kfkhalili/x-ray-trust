# How to Get Live Stripe Keys

> ⚠️ **Security Note**: This documentation describes how to get your Stripe keys. Never commit actual keys to git - always use environment variables only.

## Step 1: Get STRIPE_SECRET_KEY (Live Mode)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Make sure you're in Live Mode** (toggle in top right - should say "Live mode" not "Test mode")
3. **Navigate to**: Developers → API keys
4. **Find "Secret key"** (will start with "sk_live" prefix)
5. **Click "Reveal test key" or "Reveal live key"** to show the full key
6. **Copy the entire key** (it will be a long string starting with "sk_live")
   - ⚠️ **Note**: Your actual key will be unique and much longer

⚠️ **Important**:

- This is your **LIVE** secret key - keep it secure!
- Never commit it to git
- Only add it to Vercel environment variables (or `.env.local` for local testing)

## Step 2: Get STRIPE_WEBHOOK_SECRET (Live Mode)

### First, Create the Webhook Endpoint

1. **Make sure you're in Live Mode** (toggle in top right)
2. **Navigate to**: Developers → Webhooks
3. **Click "Add endpoint"** (or "Configure destination" in newer Stripe interface)
4. **Configure the destination**:
   - **Destination name**: `xtrustradar-production` or `xtrustradar-webhook`
     - This is just a label for your reference in Stripe Dashboard
     - Use something descriptive so you can identify it later
   - **Endpoint URL**: `https://www.xtrustradar.com/api/webhook`
     - (Or your Vercel URL if different: `https://your-app.vercel.app/api/webhook`)
   - **Description** (optional): `X Trust Radar production webhook - grants credits after successful payment`
     - Helps you remember what this webhook does
5. **Select events to listen to**:
   - Check: `checkout.session.completed`
   - (This is the event that fires when a payment succeeds)
6. **Click "Add endpoint"** (or "Save" in newer interface)

### Then, Get the Signing Secret

1. **After creating the endpoint**, click on it in the webhooks list
2. **Find "Signing secret"** (will start with "whsec" prefix)
3. **Click "Reveal"** to show the full secret
4. **Copy the entire secret** (it will be a string starting with "whsec")
   - ⚠️ **Note**: Your actual secret will be unique

⚠️ **Important**:

- This is your **LIVE** webhook secret - keep it secure!
- Never commit it to git
- Only add it to Vercel environment variables
- Each webhook endpoint has its own unique signing secret

## Step 3: Add to Environment Variables

### For Vercel (Production)

1. Go to your Vercel project dashboard
2. Navigate to: Settings → Environment Variables
3. Add these two variables:

```
STRIPE_SECRET_KEY=your_live_secret_key_from_stripe_dashboard
STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe_dashboard
```

⚠️ **Important**: Replace the placeholder text with your actual keys from Stripe Dashboard.

4. **Make sure to select "Production"** environment (and optionally "Preview" if you want)
5. Click "Save"
6. **Redeploy your application** for the changes to take effect

### For Local Testing (Optional)

If you want to test with live keys locally (not recommended, but possible):

1. Add to your `.env.local` file:

```
STRIPE_SECRET_KEY=your_live_secret_key_from_stripe_dashboard
STRIPE_WEBHOOK_SECRET=your_webhook_secret_from_stripe_dashboard
```

⚠️ **Important**: Replace the placeholder text with your actual keys from Stripe Dashboard.

⚠️ **Warning**: Testing with live keys locally means you'll be processing real payments! Use test mode for local development instead.

## Step 4: Verify Everything Works

1. **Test a real payment** (small amount, like €4.99)
2. **Check Stripe Dashboard** → Payments to see if the payment appears
3. **Check your webhook logs** in Stripe Dashboard → Developers → Webhooks → Your endpoint → Recent events
4. **Verify credits are added** to the user's account in your app

## Important Notes

### Test vs Live Keys

- **Test keys** start with "sk_test" and "whsec_PLACEHOLDER prefixes
- **Live keys** start with "sk_live" and "whsec" prefixes (no "test" in the name)
- **Never mix them**: Use test keys in test mode, live keys in live mode

### Security Best Practices

1. ✅ **Never commit keys to git** - They're already in `.gitignore`
2. ✅ **Use environment variables** - Never hardcode in your code
3. ✅ **Rotate keys if compromised** - You can regenerate them in Stripe Dashboard
4. ✅ **Use test mode for development** - Only use live keys in production
5. ✅ **Monitor webhook logs** - Check for failed deliveries

### Troubleshooting

**Webhook not receiving events?**

- Check that your endpoint URL is correct and publicly accessible
- Verify the webhook secret matches in your environment variables
- Check webhook logs in Stripe Dashboard for error messages
- Make sure your server is running and the `/api/webhook` route is accessible

**Payments not working?**

- Verify you're using the correct secret key (live vs test)
- Check that Price IDs in `lib/stripe.ts` match your live products
- Check Stripe Dashboard → Payments for any failed payments
- Review server logs for errors

## Next Steps

After setting up live keys:

1. ✅ Test with a small real payment (€4.99)
2. ✅ Verify webhook receives the event
3. ✅ Confirm credits are added correctly
4. ✅ Monitor for any errors
5. ✅ Update your `.env.example` if needed (but don't add real keys!)
