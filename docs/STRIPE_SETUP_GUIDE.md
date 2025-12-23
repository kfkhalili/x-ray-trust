# Stripe Setup Guide for X Trust Radar

## Recommended Pricing Strategy

### Recommended Pricing (German Launch)

**3-Tier Model in EUR (Recommended):**

- **50 Credits - €4.99** (€0.10 per credit)
- **100 Credits - €9.99** (€0.10 per credit) - Double credits, same price!
- **250 Credits - €19.99** (€0.08 per credit) - 20% savings

**Why EUR?** You're in Germany. Customers expect EUR, simpler for tax/accounting, no currency risk.

### Cost Considerations

**Your costs per verification:**

- twitterapi.io API call: ~$0.01-0.05 (check their pricing)
- Stripe fees: 2.9% + $0.30 per transaction
- Infrastructure: ~$0 (Vercel/Supabase free tier)

**Break-even analysis (EUR):**

- If twitterapi.io costs €0.02 per call:
  - 50 credits: €4.99 - €1.00 (API) - €0.44 (Stripe) = **€3.55 profit** (71% margin)
  - 100 credits: €9.99 - €2.00 (API) - €0.59 (Stripe) = **€7.40 profit** (74% margin)
  - 250 credits: €19.99 - €5.00 (API) - €0.88 (Stripe) = **€14.11 profit** (71% margin)

### Recommended Pricing Tiers

**3-Tier Model (Recommended for German Launch)**

```
Basic:   50 Credits - €4.99  (€0.10/credit)
Popular: 100 Credits - €9.99 (€0.10/credit) - Double credits, same price!
Pro:     250 Credits - €19.99 (€0.08/credit) - 20% savings
```

**Why this works:**

- Simple to manage as a new business
- Clear value proposition (100 credits = double for same price per credit)
- Less decision fatigue for customers
- Volume discounts incentivize larger purchases
- Rounded prices (€4.99, €9.99) are psychologically appealing
- You can add a starter pack later if needed

**Option 3: Add Subscription Later**
For now, stick with one-time payments. Consider adding monthly subscriptions later:

- $9.99/month: 100 credits (rolls over)
- $19.99/month: 250 credits (rolls over)

## How to Create Products in Stripe

### Step 1: Create Products (Not Just Prices)

1. Go to Stripe Dashboard → **Products**
2. Click **"+ Add product"**

**For each credit pack:**

**Product 1: Basic Pack**

- **Name**: "Basic Pack - 50 Credits"
- **Description**: "Perfect for trying out X Trust Radar. Verify 50 Twitter accounts and discover who you can trust."
- **Pricing**:
  - Type: **One-time**
  - Price: **€4.99 EUR**
  - Billing: **One time**
- **Tax Category**: **General - Electronically supplied services** (or `txcd_10301001`)
  - This is the standard tax category for digital services/SaaS in Stripe
  - Important for EU VAT compliance when you switch from Kleinunternehmerregelung
- Click **Save product**
- **Copy the Price ID** (starts with `price_...`)

**Product 2: Popular Pack**

- **Name**: "Popular Pack - 100 Credits"
- **Description**: "Most popular choice! Double the credits for the same price per credit. Verify 100 Twitter accounts."
- **Pricing**:
  - Type: **One-time**
  - Price: **€9.99 EUR**
  - Billing: **One time**
- **Tax Category**: **General - Electronically supplied services** (or `txcd_10301001`)
- Click **Save product**
- **Copy the Price ID**

**Product 3: Pro Pack**

- **Name**: "Pro Pack - 250 Credits"
- **Description**: "For power users and businesses. Verify 250 Twitter accounts and save 20% compared to smaller packs."
- **Pricing**:
  - Type: **One-time**
  - Price: **€19.99 EUR**
  - Billing: **One time**
- **Tax Category**: **General - Electronically supplied services** (or `txcd_10301001`)
- Click **Save product**
- **Copy the Price ID**

### Step 2: Update Your Code

Edit `lib/stripe.ts`:

```typescript
export const CREDIT_PACKS = new Map<string, number>([
  // Format: [Stripe Price ID, Credit Amount]
  ["price_YOUR_BASIC_PRICE_ID", 50], // €4.99
  ["price_YOUR_POPULAR_PRICE_ID", 100], // €9.99
  ["price_YOUR_PRO_PRICE_ID", 250], // €19.99
]);
```

Update `components/CreditModal.tsx` (already updated):

```typescript
const creditPacks = [
  { credits: 50, price: 4.99, label: "50 Credits - €4.99", popular: false },
  { credits: 100, price: 9.99, label: "100 Credits - €9.99", popular: true },
  { credits: 250, price: 19.99, label: "250 Credits - €19.99", popular: false },
];
```

### Step 3: Important Stripe Settings

**Payment Methods:**

- Enable: Card payments (default)
- Consider: Apple Pay, Google Pay (Stripe handles this automatically)

**Statement Descriptor (Important for Germany):**

The statement descriptor is what appears on your customer's credit card statement. This is **required** and helps prevent chargebacks.

**Requirements:**

- **5-22 characters** (Stripe requirement)
- **Only letters, numbers, and spaces** (no special characters like `@`, `-`, `_`)
- **Should be recognizable** - customers should know what the charge is for
- **No VAT info needed** - even with Kleinunternehmerregelung, the descriptor is just for identification

**Recommended for X Trust Radar:**

- `XTRUSTRADAR` (11 characters - simple and clear)
- `X TRUST RADAR` (13 characters - more readable)
- `XTRUSTRADAR DE` (15 characters - indicates Germany if desired)

**How to set it:**

1. Add to your `.env.local`:
   ```
   STRIPE_STATEMENT_DESCRIPTOR=XTRUSTRADAR
   ```
2. The code automatically uses this in checkout sessions
3. You can also set a default in Stripe Dashboard → Settings → Business details → Statement descriptor

**For Kleingewerbe/Kleinunternehmerregelung:**

- ✅ No VAT in the descriptor (it's just for card statements)
- ✅ Keep it simple and recognizable
- ✅ Match your business name if possible
- ✅ VAT exemption text goes on invoices/receipts, NOT in the statement descriptor

**Tax Settings:**

- **Tax Category for Products**: Set to **"General - Electronically supplied services"** (`txcd_10301001`)
  - This is the standard category for digital services/SaaS
  - Required for proper EU VAT handling when you switch from Kleinunternehmerregelung
  - Set this on each product when creating them in Stripe Dashboard
- If using Kleinunternehmerregelung: No VAT charged (see GERMAN_LAUNCH_GUIDE.md)
- If registered for VAT: Enable Stripe Tax (handles 19% VAT automatically for Germany)
- Stripe Tax can handle EU VAT automatically if needed (different rates per country)

**Currency:**

- Primary currency: EUR (you're in Germany)
- Stripe supports multi-currency if needed later

**Receipts:**

- Enable email receipts (default)
- Customize receipt email in Stripe Dashboard
- **Important**: If using Kleinunternehmerregelung, Stripe receipts should include: "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."

## Pricing Psychology Tips

1. **Use €X.99 pricing** - More appealing than round numbers
2. **Highlight savings** - "Save 20%" on larger packs
3. **Show value** - "€0.08 per verification" helps users understand
4. **Popular badge** - Mark the 100-credit pack as "Popular" (double credits!)
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

- [ ] All 3 credit packs can be purchased
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

**For your German launch, I recommend:**

```
50 Credits - €4.99  (Basic - good starting point)
100 Credits - €9.99 (Popular - double credits, same price per credit!)
250 Credits - €19.99 (Pro - 20% savings, best value)
```

**Why:**

- Simple 3-tier model (easier to manage as new business)
- Clear value proposition (100 credits = double for same price)
- Volume discounts incentivize larger purchases
- Rounded to €X.99 (psychologically better)
- Good profit margins even with API costs
- EUR pricing for German customers

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
