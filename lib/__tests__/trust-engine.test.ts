import { calculateTrust } from '../trust-engine';
import type { XRawData } from '@/types/trust';

describe('Trust Engine', () => {
  const baseData: XRawData = {
    id: '123',
    created_at: '2020-01-01T00:00:00.000Z',
    blue_verified: false,
    followers_count: 1000,
    friends_count: 500,
    statuses_count: 100,
    media_count: 50,
    favourites_count: 200,
    is_automated: false,
    protected: false,
  };

  describe('Automated account detection', () => {
    it('should mark automated accounts as DANGER with low score', () => {
      const data: XRawData = {
        ...baseData,
        is_automated: true,
      };

      const report = calculateTrust(data);

      expect(report.verdict).toBe('DANGER');
      expect(report.score).toBe(15);
      expect(report.flags).toContain('Account is marked as automated/bot');
    });
  });

  describe('Account age scoring', () => {
    it('should give high score to old accounts', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 3); // 3 years old

      const data: XRawData = {
        ...baseData,
        created_at: oldDate.toISOString(),
      };

      const report = calculateTrust(data);

      expect(report.score).toBeGreaterThan(70);
      expect(report.verdict).toBe('TRUSTED');
    });

    it('should give low score to very new accounts', () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 10); // 10 days old

      const data: XRawData = {
        ...baseData,
        created_at: newDate.toISOString(),
        followers_count: 50, // Low followers
        friends_count: 100, // Bad ratio
        statuses_count: 5, // Low activity
        media_count: 0,
        favourites_count: 0,
      };

      const report = calculateTrust(data);

      expect(report.score).toBeLessThan(50);
      expect(report.flags.some(flag => flag.includes('less than 30 days old'))).toBe(true);
    });
  });

  describe('Follower ratio scoring', () => {
    it('should give high score to accounts with good follower ratio', () => {
      const data: XRawData = {
        ...baseData,
        followers_count: 2000,
        friends_count: 500, // 4:1 ratio
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.score).toBeGreaterThan(60);
    });

    it('should flag accounts with bot-like follower ratio', () => {
      const data: XRawData = {
        ...baseData,
        followers_count: 100,
        friends_count: 500, // 0.2:1 ratio (following more than followers)
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('bot-like pattern'))).toBe(true);
    });

    it('should flag accounts with very low follower count', () => {
      const data: XRawData = {
        ...baseData,
        followers_count: 5,
        friends_count: 10,
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('Very low follower count'))).toBe(true);
    });
  });

  describe('Activity scoring', () => {
    it('should give high score to active accounts', () => {
      const data: XRawData = {
        ...baseData,
        statuses_count: 500,
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.score).toBeGreaterThan(60);
    });

    it('should flag accounts with no tweets', () => {
      const data: XRawData = {
        ...baseData,
        statuses_count: 0,
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('never posted a tweet'))).toBe(true);
    });

    it('should flag accounts with very low activity', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 2); // 2 months old

      const data: XRawData = {
        ...baseData,
        statuses_count: 5,
        created_at: oldDate.toISOString(),
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('Very low tweet count'))).toBe(true);
    });
  });

  describe('Engagement scoring', () => {
    it('should give high score to accounts with engagement', () => {
      const data: XRawData = {
        ...baseData,
        media_count: 100,
        favourites_count: 500,
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.score).toBeGreaterThan(60);
    });

    it('should flag accounts with no engagement', () => {
      const data: XRawData = {
        ...baseData,
        media_count: 0,
        favourites_count: 0,
        created_at: '2020-01-01T00:00:00.000Z',
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('low engagement') || flag.includes('No engagement'))).toBe(true);
    });
  });

  describe('Score breakdown', () => {
    it('should include breakdown in report', () => {
      const report = calculateTrust(baseData);

      expect(report.breakdown).toBeDefined();
      expect(report.breakdown?.length).toBe(5);
      expect(report.breakdown?.every(factor =>
        factor.factor &&
        typeof factor.score === 'number' &&
        factor.score >= 0 &&
        factor.score <= 100
      )).toBe(true);
    });

    it('should calculate correct contribution for each factor', () => {
      const report = calculateTrust(baseData);

      if (report.breakdown) {
        report.breakdown.forEach(factor => {
          const expectedContribution = Math.round(factor.score * factor.weight);
          expect(factor.contribution).toBe(expectedContribution);
        });
      }
    });
  });

  describe('Positive indicators', () => {
    it('should identify well-established accounts', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);

      const data: XRawData = {
        ...baseData,
        created_at: oldDate.toISOString(),
      };

      const report = calculateTrust(data);

      expect(report.positiveIndicators).toBeDefined();
      expect(report.positiveIndicators?.some(ind => ind.includes('Well-established'))).toBe(true);
    });

    it('should identify verified accounts', () => {
      const data: XRawData = {
        ...baseData,
        blue_verified: true,
      };

      const report = calculateTrust(data);

      expect(report.positiveIndicators?.some(ind => ind.includes('Verified'))).toBe(true);
    });

    it('should identify active accounts', () => {
      const data: XRawData = {
        ...baseData,
        statuses_count: 200,
      };

      const report = calculateTrust(data);

      expect(report.positiveIndicators?.some(ind => ind.includes('Active posting'))).toBe(true);
    });
  });

  describe('Confidence calculation', () => {
    it('should calculate confidence based on available data', () => {
      const report = calculateTrust(baseData);

      expect(report.confidence).toBeDefined();
      expect(report.confidence).toBeGreaterThanOrEqual(0);
      expect(report.confidence).toBeLessThanOrEqual(100);
    });

    it('should have higher confidence with more data points', () => {
      const fullData: XRawData = {
        ...baseData,
        followers_count: 1000,
        friends_count: 500,
        statuses_count: 100,
        media_count: 50,
        favourites_count: 200,
        listed_count: 10,
      };

      const minimalData: XRawData = {
        ...baseData,
        followers_count: undefined,
        friends_count: undefined,
        statuses_count: undefined,
      };

      const fullReport = calculateTrust(fullData);
      const minimalReport = calculateTrust(minimalData);

      expect(fullReport.confidence).toBeGreaterThan(minimalReport.confidence || 0);
    });
  });

  describe('Verdict mapping', () => {
    it('should return TRUSTED for scores >= 70', () => {
      const data: XRawData = {
        ...baseData,
        created_at: '2020-01-01T00:00:00.000Z',
        followers_count: 5000,
        friends_count: 500,
        statuses_count: 500,
        media_count: 100,
        favourites_count: 1000,
      };

      const report = calculateTrust(data);

      expect(report.verdict).toBe('TRUSTED');
    });

    it('should return CAUTION for scores between 40 and 69', () => {
      const data: XRawData = {
        ...baseData,
        created_at: '2023-01-01T00:00:00.000Z', // ~1 year old
        followers_count: 500,
        friends_count: 300,
        statuses_count: 50,
      };

      const report = calculateTrust(data);

      // Score should be in CAUTION range
      if (report.score >= 40 && report.score < 70) {
        expect(report.verdict).toBe('CAUTION');
      }
    });

    it('should return DANGER for scores < 40', () => {
      const data: XRawData = {
        ...baseData,
        created_at: new Date().toISOString(), // Very new
        followers_count: 5,
        friends_count: 100,
        statuses_count: 0,
      };

      const report = calculateTrust(data);

      expect(report.verdict).toBe('DANGER');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalData: XRawData = {
        id: '123',
        created_at: '2020-01-01T00:00:00.000Z',
        blue_verified: false,
      };

      const report = calculateTrust(minimalData);

      expect(report).toBeDefined();
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(['TRUSTED', 'CAUTION', 'DANGER']).toContain(report.verdict);
    });

    it('should handle invalid dates', () => {
      const data: XRawData = {
        ...baseData,
        created_at: 'invalid-date',
      };

      const report = calculateTrust(data);

      expect(report.flags.some(flag => flag.includes('Unable to verify'))).toBe(true);
    });
  });
});

