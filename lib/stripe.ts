import Stripe from 'stripe';

/**
 * Stripe client instance for server-side operations.
 * Initialized with secret key from environment variables.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * Credit pack configuration mapping Stripe Price IDs to credit amounts.
 * Using Map for O(1) lookups and type safety over object literals.
 */
export const CREDIT_PACKS = new Map<string, number>([
  // Format: [Stripe Price ID, Credit Amount]
  // Example: $5 = 50 credits, $10 = 120 credits, $20 = 250 credits
  // These Price IDs should be created in Stripe Dashboard
  // For MVP, you'll need to replace these with actual Price IDs from your Stripe account
]);

/**
 * Reverse lookup: Get Price ID from credit amount.
 * Used when user selects a credit pack to purchase.
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
 * Get credit amount for a given Price ID.
 * Returns undefined if Price ID is not found in configuration.
 */
export const getCreditsForPriceId = (priceId: string): number | undefined => {
  return CREDIT_PACKS.get(priceId);
};

