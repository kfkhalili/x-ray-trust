import { differenceInDays } from 'date-fns';
import type { XRawData, TrustReport, TrustVerdict, UserInfo, ScoreBreakdown } from '@/types/trust';

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
 * Follower/Following ratio score component.
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

  // Very low follower count is suspicious
  if (followersCount < 10) {
    return 20;
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
 * Activity score component (tweet count).
 * Accounts with no tweets are highly suspicious.
 * Accounts with substantial tweet history indicate real usage.
 */
const scoreActivity = (statusesCount: number | undefined, ageInDays: number): number => {
  if (statusesCount === undefined) {
    return 50; // Neutral if unavailable
  }

  // No tweets = very suspicious
  if (statusesCount === 0) {
    return 10;
  }

  // Very few tweets for account age is suspicious
  if (ageInDays > 30 && statusesCount < 10) {
    return 30;
  }

  // Accounts with 100+ tweets show real activity
  if (statusesCount >= 100) {
    return 100;
  }

  // Accounts with 50+ tweets are likely legitimate
  if (statusesCount >= 50) {
    return 80;
  }

  // Linear interpolation: 10 tweets = 40, 100 tweets = 100
  const minTweets = 10;
  const maxTweets = 100;
  const minScore = 40;
  const maxScore = 100;

  const normalizedTweets = Math.min(1, (statusesCount - minTweets) / (maxTweets - minTweets));
  return minScore + normalizedTweets * (maxScore - minScore);
};

/**
 * Engagement score component (media and favourites).
 * Real users engage with content. Bots rarely like or post media.
 */
const scoreEngagement = (
  mediaCount: number | undefined,
  favouritesCount: number | undefined
): number => {
  // If both unavailable, return neutral
  if (mediaCount === undefined && favouritesCount === undefined) {
    return 50;
  }

  const hasMedia = (mediaCount ?? 0) > 0;
  const hasLikes = (favouritesCount ?? 0) > 0;

  // No engagement at all is suspicious
  if (!hasMedia && !hasLikes) {
    return 30;
  }

  // Both media and likes indicate real user
  if (hasMedia && hasLikes) {
    return 90;
  }

  // Some engagement is better than none
  if (hasMedia || hasLikes) {
    return 60;
  }

  return 50;
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

  // Direct bot indicator
  if (data.is_automated === true) {
    flags.push('Account is marked as automated/bot');
  }

  // Account age flags
  if (ageInDays < 30) {
    flags.push('Account is less than 30 days old');
  }

  if (ageInDays === 0) {
    flags.push('Unable to verify account creation date');
  }

  // Activity flags
  if (data.statuses_count !== undefined && data.statuses_count === 0) {
    flags.push('Account has never posted a tweet');
  }

  if (ageInDays > 30 && data.statuses_count !== undefined && data.statuses_count < 10) {
    flags.push('Very low tweet count for account age');
  }

  // Engagement flags
  if (data.media_count === 0 && data.favourites_count === 0) {
    flags.push('No media posts or likes (low engagement)');
  }

  // Follower/following flags
  if (data.followers_count !== undefined && data.followers_count < 10) {
    flags.push('Very low follower count');
  }

  if (data.friends_count !== undefined && data.friends_count > 0 && data.followers_count !== undefined) {
    const ratio = data.followers_count / data.friends_count;
    if (ratio < 0.5) {
      flags.push('Following significantly more accounts than followers (bot-like pattern)');
    }
  }

  // Listed count flags
  if (data.listed_count !== undefined && data.listed_count === 0) {
    flags.push('Account has never been added to a list');
  }

  // Verification flags
  if (detectImpersonator(ageInDays, data.blue_verified)) {
    flags.push('Verified account created recently (possible impersonator)');
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
 * Enhanced scoring with multiple signals:
 * - Account Age: 25% (newer = riskier)
 * - Follower/Following Ratio: 25% (bots follow-back aggressively)
 * - Activity (Tweet Count): 25% (real users post content)
 * - Engagement: 15% (media and likes indicate real usage)
 * - Listed Count: 10% (human curation signal, but often unavailable)
 *
 * Special handling:
 * - Automated accounts get maximum penalty
 * - Very low follower counts are penalized
 * - No activity is heavily penalized
 *
 * @param data - Raw account metadata from twitterapi.io
 * @returns Immutable TrustReport with score, verdict, and risk flags
 */
export const calculateTrust = (data: XRawData): TrustReport => {
  const ageInDays = calculateAccountAge(data.created_at);

  // Direct bot detection - severe penalty
  if (data.is_automated === true) {
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
      score: 15, // Very low score for automated accounts
      verdict: 'DANGER',
      flags: ['Account is marked as automated/bot', ...generateFlags(data, ageInDays)],
      breakdown: [
        {
          factor: 'Account Type',
          score: 15,
          weight: 1.0,
          contribution: 15,
          status: 'negative',
          explanation: 'Account is marked as automated/bot',
        },
      ],
      confidence: 100, // High confidence when automated flag is set
    } as const;
  }

  const ageScore = scoreAccountAge(ageInDays);
  const ratioScore = scoreFollowerRatio(data.followers_count, data.friends_count);
  const activityScore = scoreActivity(data.statuses_count, ageInDays);
  const engagementScore = scoreEngagement(data.media_count, data.favourites_count);
  const listedScore = scoreListedCount(data.listed_count);

  // Weighted combination with enhanced signals
  // Age: 25%, Ratio: 25%, Activity: 25%, Engagement: 15%, Listed: 10%
  const weightedScore = Math.round(
    ageScore * 0.25 +
    ratioScore * 0.25 +
    activityScore * 0.25 +
    engagementScore * 0.15 +
    listedScore * 0.10
  );

  const flags = generateFlags(data, ageInDays);
  const verdict = scoreToVerdict(weightedScore);

  // Generate score breakdown
  const breakdown: ScoreBreakdown[] = [
    {
      factor: 'Account Age',
      score: ageScore,
      weight: 0.25,
      contribution: Math.round(ageScore * 0.25),
      status: ageScore >= 70 ? 'positive' : ageScore >= 40 ? 'neutral' : 'negative',
      explanation: ageInDays >= 730
        ? 'Account is well-established (2+ years old)'
        : ageInDays >= 365
        ? 'Account is established (1+ year old)'
        : ageInDays >= 90
        ? 'Account is relatively new (3+ months old)'
        : 'Account is very new (less than 3 months old)',
    },
    {
      factor: 'Follower Ratio',
      score: ratioScore,
      weight: 0.25,
      contribution: Math.round(ratioScore * 0.25),
      status: ratioScore >= 70 ? 'positive' : ratioScore >= 40 ? 'neutral' : 'negative',
      explanation: data.followers_count !== undefined && data.friends_count !== undefined
        ? data.friends_count > 0
          ? `Healthy ratio: ${Math.round((data.followers_count / data.friends_count) * 10) / 10}x more followers than following`
          : 'Account follows no one'
        : 'Follower data unavailable',
    },
    {
      factor: 'Activity Level',
      score: activityScore,
      weight: 0.25,
      contribution: Math.round(activityScore * 0.25),
      status: activityScore >= 70 ? 'positive' : activityScore >= 40 ? 'neutral' : 'negative',
      explanation: data.statuses_count !== undefined
        ? data.statuses_count >= 100
          ? `Active account with ${data.statuses_count.toLocaleString()} tweets`
          : data.statuses_count >= 50
          ? `Moderate activity with ${data.statuses_count.toLocaleString()} tweets`
          : data.statuses_count > 0
          ? `Low activity with ${data.statuses_count} tweets`
          : 'No tweets posted'
        : 'Activity data unavailable',
    },
    {
      factor: 'Engagement',
      score: engagementScore,
      weight: 0.15,
      contribution: Math.round(engagementScore * 0.15),
      status: engagementScore >= 70 ? 'positive' : engagementScore >= 40 ? 'neutral' : 'negative',
      explanation: (data.media_count ?? 0) > 0 && (data.favourites_count ?? 0) > 0
        ? 'Account posts media and engages with content'
        : (data.media_count ?? 0) > 0 || (data.favourites_count ?? 0) > 0
        ? 'Some engagement detected'
        : 'No engagement detected',
    },
    {
      factor: 'Listed Count',
      score: listedScore,
      weight: 0.10,
      contribution: Math.round(listedScore * 0.10),
      status: listedScore >= 70 ? 'positive' : listedScore >= 40 ? 'neutral' : 'negative',
      explanation: data.listed_count !== undefined
        ? data.listed_count >= 10
          ? `Highly curated: listed ${data.listed_count} times`
          : data.listed_count > 0
          ? `Listed ${data.listed_count} time${data.listed_count > 1 ? 's' : ''}`
          : 'Never added to lists'
        : 'Listed count unavailable',
    },
  ];

  // Generate positive indicators
  const positiveIndicators: string[] = [];

  if (ageInDays >= 365) {
    positiveIndicators.push('Well-established account');
  }

  if (data.blue_verified) {
    positiveIndicators.push('Verified account');
  }

  if (data.followers_count !== undefined && data.followers_count >= 1000) {
    positiveIndicators.push('Significant follower base');
  }

  if (data.statuses_count !== undefined && data.statuses_count >= 100) {
    positiveIndicators.push('Active posting history');
  }

  if (data.media_count !== undefined && data.media_count > 0) {
    positiveIndicators.push('Posts media content');
  }

  if (data.followers_count !== undefined && data.friends_count !== undefined && data.friends_count > 0) {
    const ratio = data.followers_count / data.friends_count;
    if (ratio >= 2.0) {
      positiveIndicators.push('Strong organic growth pattern');
    }
  }

  // Calculate confidence based on data availability
  const dataPoints = [
    data.followers_count !== undefined,
    data.friends_count !== undefined,
    data.statuses_count !== undefined,
    data.media_count !== undefined,
    data.favourites_count !== undefined,
    data.listed_count !== undefined,
  ];
  const availableDataPoints = dataPoints.filter(Boolean).length;
  const confidence = Math.round((availableDataPoints / dataPoints.length) * 100);

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
    breakdown,
    positiveIndicators: positiveIndicators.length > 0 ? positiveIndicators : undefined,
    confidence,
  } as const;
};

