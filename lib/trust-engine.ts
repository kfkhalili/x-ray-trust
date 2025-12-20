import { differenceInDays } from 'date-fns';
import type { XRawData, TrustReport, TrustVerdict, UserInfo } from '@/types/trust';

/**
 * Calculates account age in days from creation date.
 * Returns 0 if date parsing fails to prevent division by zero errors.
 */
const calculateAccountAge = (createdAt: string): number => {
  const createdDate = new Date(createdAt);
  const now = new Date();

  // Invalid dates return NaN, which would break calculations
  if (isNaN(createdDate.getTime())) {
    return 0;
  }

  return Math.max(0, differenceInDays(now, createdDate));
};

/**
 * Account age score component (40% weight).
 * Newer accounts (< 30 days) are high risk, older accounts (> 2 years) are low risk.
 * Linear interpolation between these thresholds.
 */
const scoreAccountAge = (ageInDays: number): number => {
  if (ageInDays === 0) {
    return 0; // Invalid date = maximum risk
  }

  // Accounts older than 2 years (730 days) get full points
  if (ageInDays >= 730) {
    return 100;
  }

  // Accounts newer than 30 days get minimal points (10% of max)
  if (ageInDays < 30) {
    return 10;
  }

  // Linear interpolation: 30 days = 10, 730 days = 100
  const minAge = 30;
  const maxAge = 730;
  const minScore = 10;
  const maxScore = 100;

  const normalizedAge = (ageInDays - minAge) / (maxAge - minAge);
  return minScore + normalizedAge * (maxScore - minScore);
};

/**
 * Listed count score component (30% weight).
 * Listed count is the strongest signal of human curation - bots rarely get listed.
 * Accounts with 0 listings are suspicious, accounts with 10+ are highly trusted.
 * Returns neutral score (50) if data is unavailable.
 */
const scoreListedCount = (listedCount: number | undefined): number => {
  // If data unavailable, return neutral score
  if (listedCount === undefined) {
    return 50;
  }

  if (listedCount === 0) {
    return 20; // No listings = high suspicion
  }

  // Accounts with 10+ listings are highly trusted
  if (listedCount >= 10) {
    return 100;
  }

  // Linear interpolation: 1 listing = 40, 10 listings = 100
  const minListed = 1;
  const maxListed = 10;
  const minScore = 40;
  const maxScore = 100;

  const normalizedListed = (listedCount - minListed) / (maxListed - minListed);
  return Math.min(100, minScore + normalizedListed * (maxScore - minScore));
};

/**
 * Follower/Following ratio score component (30% weight).
 * Bots typically follow-back aggressively (high following, low followers).
 * Healthy accounts have ratios > 1.0 (more followers than following).
 * Returns neutral score (50) if data is unavailable.
 */
const scoreFollowerRatio = (
  followersCount: number | undefined,
  friendsCount: number | undefined
): number => {
  // If data unavailable, return neutral score
  if (followersCount === undefined || friendsCount === undefined) {
    return 50;
  }

  // Prevent division by zero
  if (friendsCount === 0) {
    // If following 0 but has followers, that's actually suspicious (likely locked account)
    return followersCount > 0 ? 50 : 30;
  }

  const ratio = followersCount / friendsCount;

  // Ratio > 2.0 indicates strong organic growth (not bot-like)
  if (ratio >= 2.0) {
    return 100;
  }

  // Ratio < 0.5 indicates bot-like behavior (following more than being followed)
  if (ratio < 0.5) {
    return 20;
  }

  // Linear interpolation: 0.5 = 20, 2.0 = 100
  const minRatio = 0.5;
  const maxRatio = 2.0;
  const minScore = 20;
  const maxScore = 100;

  const normalizedRatio = (ratio - minRatio) / (maxRatio - minRatio);
  return minScore + normalizedRatio * (maxScore - minScore);
};

/**
 * Detects impersonator patterns: verified accounts that are too new.
 * Legitimate verified accounts are typically established, not created recently.
 */
const detectImpersonator = (ageInDays: number, blueVerified: boolean): boolean => {
  return blueVerified && ageInDays < 30;
};

/**
 * Generates human-readable risk flags based on detected patterns.
 * Returns immutable array of flag descriptions.
 */
const generateFlags = (data: XRawData, ageInDays: number): readonly string[] => {
  const flags: string[] = [];

  if (ageInDays < 30) {
    flags.push('Account is less than 30 days old');
  }

  if (data.listed_count !== undefined && data.listed_count === 0) {
    flags.push('Account has never been added to a list');
  }

  if (data.friends_count !== undefined && data.friends_count > 0 && data.followers_count !== undefined) {
    const ratio = data.followers_count / data.friends_count;
    if (ratio < 0.5) {
      flags.push('Following significantly more accounts than followers (bot-like pattern)');
    }
  }

  if (detectImpersonator(ageInDays, data.blue_verified)) {
    flags.push('Verified account created recently (possible impersonator)');
  }

  if (ageInDays === 0) {
    flags.push('Unable to verify account creation date');
  }

  return flags;
};

/**
 * Maps numeric score (0-100) to categorical verdict.
 * Thresholds chosen to balance false positives vs false negatives.
 */
const scoreToVerdict = (score: number): TrustVerdict => {
  if (score >= 70) {
    return 'TRUSTED';
  }

  if (score >= 40) {
    return 'CAUTION';
  }

  return 'DANGER';
};

/**
 * Pure function that transforms raw X account data into a trust assessment.
 *
 * Scoring weights:
 * - Account Age: 40% (newer = riskier)
 * - Listed Count: 30% (best signal of human curation)
 * - Follower/Following Ratio: 30% (bots follow-back aggressively)
 *
 * @param data - Raw account metadata from twitterapi.io
 * @returns Immutable TrustReport with score, verdict, and risk flags
 */
export const calculateTrust = (data: XRawData): TrustReport => {
  const ageInDays = calculateAccountAge(data.created_at);

  const ageScore = scoreAccountAge(ageInDays);
  const listedScore = scoreListedCount(data.listed_count);
  const ratioScore = scoreFollowerRatio(data.followers_count, data.friends_count);

  // Weighted combination: 40% age + 30% listed + 30% ratio
  const weightedScore = Math.round(
    ageScore * 0.4 + listedScore * 0.3 + ratioScore * 0.3
  );

  const flags = generateFlags(data, ageInDays);
  const verdict = scoreToVerdict(weightedScore);

  // Extract user info if available
  const userInfo: UserInfo | undefined = data._userInfo;

  return {
    userInfo: userInfo || {
      id: data.id,
      username: 'unknown',
      name: 'Unknown User',
      createdAt: data.created_at,
      blueVerified: data.blue_verified,
      followersCount: data.followers_count,
      followingCount: data.friends_count,
    },
    score: weightedScore,
    verdict,
    flags,
  } as const;
};

