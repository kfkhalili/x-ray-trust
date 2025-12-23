import { getPriceIdForCredits, getCreditsForPriceId, CREDIT_PACKS } from '../stripe';

describe('Stripe Utilities', () => {
  describe('getPriceIdForCredits', () => {
    it('should return price ID for valid credit amount', () => {
      // Get the first price ID from CREDIT_PACKS
      const credits = Array.from(CREDIT_PACKS.values())[0];
      const priceId = getPriceIdForCredits(credits);
      
      expect(priceId).toBeDefined();
      expect(typeof priceId).toBe('string');
    });

    it('should return undefined for invalid credit amount', () => {
      const priceId = getPriceIdForCredits(999);
      expect(priceId).toBeUndefined();
    });

    it('should return undefined for zero credits', () => {
      const priceId = getPriceIdForCredits(0);
      expect(priceId).toBeUndefined();
    });

    it('should return undefined for negative credits', () => {
      const priceId = getPriceIdForCredits(-10);
      expect(priceId).toBeUndefined();
    });
  });

  describe('getCreditsForPriceId', () => {
    it('should return credits for valid price ID', () => {
      // Get the first price ID from CREDIT_PACKS
      const priceId = Array.from(CREDIT_PACKS.keys())[0];
      const credits = getCreditsForPriceId(priceId);
      
      expect(credits).toBeDefined();
      expect(typeof credits).toBe('number');
      expect(credits).toBeGreaterThan(0);
    });

    it('should return undefined for invalid price ID', () => {
      const credits = getCreditsForPriceId('invalid_price_id');
      expect(credits).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const credits = getCreditsForPriceId('');
      expect(credits).toBeUndefined();
    });
  });

  describe('CREDIT_PACKS consistency', () => {
    it('should have at least one credit pack configured', () => {
      expect(CREDIT_PACKS.size).toBeGreaterThan(0);
    });

    it('should have valid price IDs (non-empty strings)', () => {
      for (const priceId of CREDIT_PACKS.keys()) {
        expect(typeof priceId).toBe('string');
        expect(priceId.length).toBeGreaterThan(0);
      }
    });

    it('should have positive credit values', () => {
      for (const credits of CREDIT_PACKS.values()) {
        expect(credits).toBeGreaterThan(0);
        expect(Number.isInteger(credits)).toBe(true);
      }
    });

    it('should have bidirectional mapping consistency', () => {
      for (const [priceId, credits] of CREDIT_PACKS.entries()) {
        const retrievedPriceId = getPriceIdForCredits(credits);
        const retrievedCredits = getCreditsForPriceId(priceId);
        
        expect(retrievedPriceId).toBe(priceId);
        expect(retrievedCredits).toBe(credits);
      }
    });
  });
});

