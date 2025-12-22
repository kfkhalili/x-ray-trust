import Stripe from 'stripe';

/**
 * Stripe client for server-side payment operations.
 *
 * API version pinned to prevent breaking changes. Stripe updates API versions
 * regularly; pinning ensures our code doesn't break when Stripe releases new versions.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * Credit pack pricing configuration.
 *
 * Why Map? O(1) lookups when finding price IDs by credit amount during checkout.
 * Also provides better type safety than object literals—TypeScript enforces
 * the string→number mapping contract.
 */
export const CREDIT_PACKS = new Map<string, number>([
  // Format: [Stripe Price ID, Credit Amount]
  // Example: $5 = 50 credits, $10 = 120 credits, $20 = 250 credits
  // These Price IDs should be created in Stripe Dashboard
  // For MVP, you'll need to replace these with actual Price IDs from your Stripe account
]);

/**
 * Finds Stripe Price ID for a given credit amount.
 *
 * Used during checkout when user selects "50 credits" and we need to find
 * the corresponding Stripe Price ID to create the checkout session.
 */
export const getPriceIdForCredits = (credits: number): string | undefined => {
  for (const [priceId, creditAmount] of CREDIT_PACKS.entries()) {
    if (creditAmount === credits) {
      return priceId;
    }
  }
  return undefined;
};

/**
 * Looks up credit amount for a Stripe Price ID.
 *
 * Used in webhook handler to determine how many credits to grant based on
 * the Price ID from the completed checkout session.
 */
export const getCreditsForPriceId = (priceId: string): number | undefined => {
  return CREDIT_PACKS.get(priceId);
};

