import Stripe from 'stripe';

/**
 * Stripe client for server-side payment operations.
 *
 * API version pinned to prevent breaking changes. Stripe updates API versions
 * regularly; pinning ensures our code doesn't break when Stripe releases new versions.
 *
 * Why lazy initialization? During build time, environment variables might not be
 * available. We create the client only when needed (lazy initialization) to prevent
 * build-time errors in Vercel.
 */
let stripeInstance: Stripe | null = null;

export const stripe = (): Stripe => {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });

  return stripeInstance;
};

/**
 * Credit pack pricing configuration.
 *
 * Why Map? O(1) lookups when finding price IDs by credit amount during checkout.
 * Also provides better type safety than object literals—TypeScript enforces
 * the string→number mapping contract.
 */
export const CREDIT_PACKS = new Map<string, number>([
  // Format: [Stripe Price ID, Credit Amount]
  // Example: €4.99 = 50 credits, €9.99 = 100 credits, €19.99 = 250 credits
  // These Price IDs should be created in Stripe Dashboard
  // See docs/GERMAN_LAUNCH_GUIDE.md for setup instructions
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

