# Stripe Setup Guide for X-Ray Trust

## Recommended Pricing Strategy

### Current Pricing Analysis

Your current pricing:
- **50 Credits - $5.00** ($0.10 per credit)
- **120 Credits - $10.00** ($0.083 per credit) - 17% discount
- **250 Credits - $20.00** ($0.08 per credit) - 20% discount

### Cost Considerations

**Your costs per verification:**
- twitterapi.io API call: ~$0.01-0.05 (check their pricing)
- Stripe fees: 2.9% + $0.30 per transaction
- Infrastructure: ~$0 (Vercel/Supabase free tier)

**Break-even analysis:**
- If twitterapi.io costs $0.02 per call:
  - 50 credits: $5.00 - $1.00 (API) - $0.45 (Stripe) = **$3.55 profit** (71% margin)
  - 120 credits: $10.00 - $2.40 (API) - $0.59 (Stripe) = **$7.01 profit** (70% margin)
  - 250 credits: $20.00 - $5.00 (API) - $0.88 (Stripe) = **$14.12 profit** (71% margin)

### Recommended Pricing Tiers

**Option 1: Current Model (Recommended for Launch)**
```
Starter Pack:  25 Credits - $2.99  ($0.12/credit) - Low barrier to entry
Standard Pack: 50 Credits - $4.99  ($0.10/credit) - Most popular
Value Pack:   120 Credits - $9.99  ($0.083/credit) - 17% savings
Pro Pack:     250 Credits - $19.99 ($0.08/credit) - 20% savings
```

**Why this works:**
- Low entry point ($2.99) reduces friction
- Clear value progression
- Volume discounts incentivize larger purchases
- Rounded prices ($2.99, $4.99) are psychologically appealing

**Option 2: Simpler 3-Tier Model**
```
Basic:   50 Credits - $4.99  ($0.10/credit)
Popular: 100 Credits - $9.99 ($0.10/credit) - Same price, double credits
Pro:     250 Credits - $19.99 ($0.08/credit) - 20% savings
```

**Option 3: Add Subscription Later**
For now, stick with one-time payments. Consider adding monthly subscriptions later:
- $9.99/month: 100 credits (rolls over)
- $19.99/month: 250 credits (rolls over)

## How to Create Products in Stripe

### Step 1: Create Products (Not Just Prices)

1. Go to Stripe Dashboard → **Products**
2. Click **"+ Add product"**

**For each credit pack:**

**Product 1: Starter Pack**
- **Name**: "Starter Pack - 25 Credits"
- **Description**: "Perfect for trying out X-Ray Trust. Verify 25 Twitter accounts."
- **Pricing**: 
  - Type: **One-time**
  - Price: **$2.99 USD**
  - Billing: **One time**
- Click **Save product**
- **Copy the Price ID** (starts with `price_...`)

**Product 2: Standard Pack**
- **Name**: "Standard Pack - 50 Credits"
- **Description**: "Most popular choice. Verify 50 Twitter accounts."
- **Pricing**: 
  - Type: **One-time**
  - Price: **$4.99 USD**
  - Billing: **One time**
- Click **Save product**
- **Copy the Price ID**

**Product 3: Value Pack**
- **Name**: "Value Pack - 120 Credits"
- **Description**: "Best value! Verify 120 Twitter accounts. Save 17%."
- **Pricing**: 
  - Type: **One-time**
  - Price: **$9.99 USD**
  - Billing: **One time**
- Click **Save product**
- **Copy the Price ID**

**Product 4: Pro Pack**
- **Name**: "Pro Pack - 250 Credits"
- **Description**: "For power users. Verify 250 Twitter accounts. Save 20%."
- **Pricing**: 
  - Type: **One-time**
  - Price: **$19.99 USD**
  - Billing: **One time**
- Click **Save product**
- **Copy the Price ID**

### Step 2: Update Your Code

Edit `lib/stripe.ts`:

```typescript
export const CREDIT_PACKS = new Map<string, number>([
  // Format: [Stripe Price ID, Credit Amount]
  ['price_YOUR_STARTER_PRICE_ID', 25],   // $2.99
  ['price_YOUR_STANDARD_PRICE_ID', 50],  // $4.99
  ['price_YOUR_VALUE_PRICE_ID', 120],    // $9.99
  ['price_YOUR_PRO_PRICE_ID', 250],      // $19.99
]);
```

Update `components/CreditModal.tsx`:

```typescript
const creditPacks = [
  { credits: 25, price: 2.99, label: '25 Credits - $2.99', popular: false },
  { credits: 50, price: 4.99, label: '50 Credits - $4.99', popular: true },
  { credits: 120, price: 9.99, label: '120 Credits - $9.99', popular: false },
  { credits: 250, price: 19.99, label: '250 Credits - $19.99', popular: false },
];
```

### Step 3: Important Stripe Settings

**Payment Methods:**
- Enable: Card payments (default)
- Consider: Apple Pay, Google Pay (Stripe handles this automatically)

**Tax Settings:**
- If selling in EU: Enable tax collection
- Stripe Tax can handle this automatically
- For Germany: You'll need to collect VAT (19%)

**Currency:**
- Start with USD
- Can add EUR later if needed
- Stripe supports multi-currency

**Receipts:**
- Enable email receipts (default)
- Customize receipt email in Stripe Dashboard

## Pricing Psychology Tips

1. **Use $X.99 pricing** - More appealing than round numbers
2. **Highlight savings** - "Save 20%" on larger packs
3. **Show value** - "$0.08 per verification" helps users understand
4. **Popular badge** - Mark the 50-credit pack as "Most Popular"
5. **Clear progression** - Make it obvious which pack is best value

## Testing Before Launch

### Test Mode Setup

1. Use Stripe **Test Mode** (toggle in dashboard)
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Test all credit pack purchases
5. Verify webhook receives events
6. Verify credits are added correctly

### Test Checklist

- [ ] All 4 credit packs can be purchased
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Credits are added to user account
- [ ] Receipt emails are sent
- [ ] Error handling works (insufficient funds, etc.)

## Going Live

### Switch to Live Mode

1. **Toggle to Live Mode** in Stripe Dashboard
2. **Create products again** in Live Mode (test and live are separate)
3. **Update Price IDs** in your code
4. **Update webhook** to use live webhook secret
5. **Test with real card** (your own, small amount)
6. **Monitor** Stripe Dashboard for first real transactions

### Legal Considerations

- **Refund Policy**: Clearly state in Terms of Service
- **EU VAT**: If selling to EU customers, Stripe Tax handles this
- **Receipts**: Required for business customers (Stripe auto-generates)
- **Terms**: Make sure your Terms of Service mention credit purchases

## Monitoring & Optimization

### Key Metrics to Track

1. **Conversion rate** by credit pack
2. **Average order value**
3. **Most popular pack**
4. **Refund rate**
5. **Customer lifetime value**

### Optimization Ideas

- **A/B test pricing** - Try different price points
- **Limited-time offers** - "20% off Pro Pack this week"
- **Bulk discounts** - Add 500-credit pack for $39.99
- **Subscription option** - Monthly recurring revenue

## Recommended Launch Pricing

**For your real launch, I recommend:**

```
25 Credits - $2.99  (Starter - low friction entry)
50 Credits - $4.99  (Standard - most popular, mark as "Popular")
120 Credits - $9.99 (Value - 17% savings)
250 Credits - $19.99 (Pro - 20% savings, best value)
```

**Why:**
- $2.99 entry point removes barrier to first purchase
- Clear value progression
- Volume discounts incentivize larger purchases
- Rounded to $X.99 (psychologically better)
- Good profit margins even with API costs

## Next Steps

1. ✅ Create products in Stripe Dashboard (Test Mode first)
2. ✅ Copy Price IDs
3. ✅ Update `lib/stripe.ts` with Price IDs
4. ✅ Update `components/CreditModal.tsx` with new packs
5. ✅ Test all purchases in Test Mode
6. ✅ Switch to Live Mode
7. ✅ Create products in Live Mode
8. ✅ Update code with Live Price IDs
9. ✅ Launch! 🚀

