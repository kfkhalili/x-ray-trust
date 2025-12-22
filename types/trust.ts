/**
 * Raw X account metadata from twitterapi.io.
 *
 * All fields readonly to prevent accidental mutation during scoring.
 * Optional fields reflect API reality—not all data is always available.
 */
export type XRawData = {
  readonly id: string;
  readonly created_at: string;
  readonly followers_count?: number;
  readonly friends_count?: number;
  readonly listed_count?: number; // Not available in /twitter/user/info endpoint
  readonly blue_verified: boolean;
  readonly statuses_count?: number; // Tweet count - indicates activity
  readonly media_count?: number; // Media posts - indicates engagement
  readonly favourites_count?: number; // Likes given - indicates engagement
  readonly is_automated?: boolean; // Direct bot indicator
  readonly protected?: boolean; // Private account
  readonly _userInfo?: UserInfo; // Internal field for passing user info to trust report
};

/**
 * Categorical verdicts for quick decision-making.
 *
 * Three categories mirror traffic light intuition: green/yellow/red.
 * More categories create decision paralysis; fewer lose nuance.
 */
export type TrustVerdict = "TRUSTED" | "CAUTION" | "DANGER";

/**
 * User account information from X (Twitter).
 */
export interface UserInfo {
  readonly id: string;
  readonly username: string;
  readonly name: string;
  readonly profilePicture?: string;
  readonly followersCount?: number;
  readonly followingCount?: number;
  readonly createdAt: string;
  readonly blueVerified: boolean;
  readonly description?: string;
}

/**
 * Score breakdown showing contribution of each factor.
 */
export interface ScoreBreakdown {
  readonly factor: string;
  readonly score: number; // 0-100
  readonly weight: number; // 0-1, contribution to final score
  readonly contribution: number; // Actual contribution (score * weight)
  readonly status: 'positive' | 'neutral' | 'negative';
  readonly explanation: string;
}

/**
 * Complete trust assessment with transparency signals.
 *
 * Score alone isn't actionable—users need flags (why it's risky),
 * positive indicators (why to trust it), and confidence (how sure we are).
 */
export interface TrustReport {
  readonly userInfo: UserInfo;
  readonly score: number; // 0-100, where 100 is most trustworthy
  readonly verdict: TrustVerdict;
  readonly flags: readonly string[];
  readonly breakdown?: readonly ScoreBreakdown[]; // Optional score breakdown
  readonly positiveIndicators?: readonly string[]; // What's good about the account
  readonly confidence?: number; // 0-100, how confident we are in the assessment
}
