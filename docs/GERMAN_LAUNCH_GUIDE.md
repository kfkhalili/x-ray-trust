# German Launch Guide: Kleingewerbe/Kleinunternehmen

## Recommended Pricing for German Launch

### Simple 3-Tier Model (Recommended)

**Start simple. You can always add more tiers later.**

```
Basic:   50 Credits - €4.99  (€0.10/credit)
Popular: 100 Credits - €9.99  (€0.10/credit) - Double credits, same price!
Pro:     250 Credits - €19.99 (€0.08/credit) - 20% savings
```

**Why 3 tiers:**

- Easier to manage as a new business
- Clear value proposition
- Less decision fatigue for customers
- You can add a starter pack later if needed

**Why EUR instead of USD:**

- You're in Germany, customers expect EUR
- Stripe handles currency conversion automatically
- Simpler for tax/accounting
- No currency risk

## German Business Registration

### Kleingewerbe vs Kleinunternehmen

**Kleingewerbe** (Small Trade):

- Revenue under €22,000/year
- No VAT registration required (Kleinunternehmerregelung)
- Simpler accounting
- **Recommended for your first year**

**Kleinunternehmen** (Small Enterprise):

- Revenue €22,000-€500,000/year
- Must register for VAT (Umsatzsteuer)
- More complex accounting
- Can opt for Kleinunternehmerregelung if under €22,000

### Steps to Register

1. **Gewerbeanmeldung** (Business Registration)

   - Go to your local **Gewerbeamt** (Trade Office)
   - Fill out "Anmeldung eines Gewerbes"
   - Cost: ~€15-30
   - Bring: ID, proof of address

2. **Tax Office Registration**

   - Finanzamt will contact you automatically after Gewerbeanmeldung
   - You'll get a **Steuernummer** (tax number)
   - Important: Declare **Kleinunternehmerregelung** if revenue < €22,000

3. **Optional: IHK Registration**
   - If revenue > €5,200/year, you may need to register with IHK
   - Check your local IHK requirements

### Kleinunternehmerregelung (Small Business Regulation)

**If you opt for this (recommended for first year):**

- ✅ No VAT on invoices (you don't charge 19% Mehrwertsteuer)
- ✅ No VAT returns (no Umsatzsteuervoranmeldung)
- ✅ Simpler accounting
- ❌ Can't claim VAT back on expenses
- ❌ Must show "Kleinunternehmerregelung" on invoices

**When to switch to full VAT:**

- Revenue exceeds €22,000/year
- You want to claim VAT back on business expenses
- You're selling to businesses (B2B) who need VAT invoices

## Stripe Setup for Germany

### Currency Settings

1. **Set primary currency to EUR** in Stripe Dashboard
2. **Enable Stripe Tax** (handles VAT automatically if you switch later)
3. **Configure tax rates:**
   - Germany: 19% VAT (if not using Kleinunternehmerregelung)
   - EU countries: Varies (Stripe Tax handles this)

### Statement Descriptor (Required)

**What it is:** The text that appears on your customer's credit card statement.

**Requirements:**
- **5-22 characters** (Stripe requirement)
- **Only letters, numbers, and spaces** (no special characters)
- **Should be recognizable** - customers should know what the charge is for

**For Kleingewerbe/Kleinunternehmerregelung:**
- ✅ **No VAT info needed** - the descriptor is just for identification on card statements
- ✅ Keep it simple and match your business name
- ✅ VAT exemption text goes on invoices/receipts, NOT in the statement descriptor

**Recommended:**
- `XRAYTRUST` (9 characters - simple and clear)
- `XRAY TRUST` (10 characters - more readable)

**How to set:**
1. Add `STRIPE_STATEMENT_DESCRIPTOR=XRAYTRUST` to your `.env.local`
2. Or set default in Stripe Dashboard → Settings → Business details → Statement descriptor

### Invoice Requirements (Germany)

**If using Kleinunternehmerregelung, invoices must show:**

```
"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
(According to § 19 UStG, no VAT is charged.)
```

**Stripe automatically includes this** if you configure it correctly in Stripe Dashboard → Settings → Business details → Tax settings.

### Payment Methods

- ✅ Card payments (default)
- ✅ SEPA Direct Debit (popular in Germany) - Enable in Stripe
- ✅ Apple Pay / Google Pay (automatic)

## Recommended Launch Strategy

### Phase 1: Start Simple (First 3-6 Months)

**Pricing:**

```
50 Credits - €4.99
100 Credits - €9.99
250 Credits - €19.99
```

**Why:**

- Simple to manage
- Easy accounting
- Test the market
- See which pack sells best

**Business Setup:**

- Register as Kleingewerbe
- Use Kleinunternehmerregelung (no VAT)
- Simple bookkeeping (Einnahmen-Überschuss-Rechnung)

### Phase 2: Optimize (After 6 Months)

**Based on data:**

- Add starter pack if needed (€2.99 for 25 credits)
- Adjust pricing based on conversion rates
- Consider subscription model if customers buy regularly

**If revenue > €22,000:**

- Switch to full VAT registration
- Update Stripe to charge 19% VAT
- Start claiming VAT back on expenses

## Accounting & Taxes

### What You Need to Track

1. **Revenue** (all Stripe payments)
2. **Expenses:**

   - twitterapi.io costs
   - Stripe fees
   - Domain/hosting (if paid)
   - Business registration fees
   - Software subscriptions

3. **Profit = Revenue - Expenses**

### Tax Obligations

**Income Tax (Einkommensteuer):**

- Profit is added to your personal income
- Taxed at your personal tax rate
- Use **Einnahmen-Überschuss-Rechnung** (EÜR) for simple accounting

**VAT (Umsatzsteuer):**

- None if using Kleinunternehmerregelung
- 19% if registered for VAT

### Recommended Tools

- **Lexoffice** or **sevDesk** - German accounting software (€10-20/month)
- **Stripe Dashboard** - Track all payments
- **Simple spreadsheet** - Track expenses (if just starting)

## Legal Considerations

### Terms of Service

- ✅ Already have template (needs lawyer review)
- ✅ German jurisdiction specified
- ✅ Refund policy included

### Privacy Policy

- ✅ GDPR compliant
- ✅ German supervisory authority (BfDI) mentioned
- ✅ Data retention (10 years for tax records)

### Invoices/Receipts

- Stripe automatically generates receipts
- Include required German text if using Kleinunternehmerregelung
- Keep records for 10 years (GoBD)

## My Recommendation

**For your launch:**

1. **Start with 3 tiers in EUR:**

   - 50 Credits - €4.99
   - 100 Credits - €9.99
   - 250 Credits - €19.99

2. **Register as Kleingewerbe:**

   - Use Kleinunternehmerregelung (no VAT)
   - Simpler accounting
   - Can switch later if needed

3. **Set up Stripe in EUR:**

   - Primary currency: EUR
   - Enable SEPA Direct Debit
   - Configure for Kleinunternehmerregelung

4. **Keep it simple:**
   - Track revenue in Stripe
   - Track expenses in spreadsheet
   - Use EÜR for tax filing
   - Add complexity later as you grow

**You can always:**

- Add more tiers later
- Switch to VAT registration when revenue grows
- Add subscriptions when you have data
- Optimize pricing based on real customer behavior

## Next Steps

1. ✅ Register Gewerbe at local Gewerbeamt
2. ✅ Declare Kleinunternehmerregelung to Finanzamt
3. ✅ Create 3 products in Stripe (EUR, one-time payments)
4. ✅ Update code with Price IDs
5. ✅ Test in Stripe Test Mode
6. ✅ Launch! 🚀
