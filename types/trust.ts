/**
 * Raw data structure from twitterapi.io /twitter/user/info endpoint.
 * All fields are readonly to enforce immutability in functional transformations.
 * Note: followers_count, friends_count, and listed_count may be unavailable from user_about endpoint.
 */
export type XRawData = {
  readonly id: string;
  readonly created_at: string;
  readonly followers_count?: number; // Optional - not available in user_about endpoint
  readonly friends_count?: number; // Optional - not available in user_about endpoint
  readonly listed_count?: number; // Optional - not available in user_about endpoint
  readonly blue_verified: boolean;
  readonly _userInfo?: UserInfo; // Internal field for passing user info to trust report
};

/**
 * Trust verdict categories based on calculated risk score.
 * TRUSTED: Low risk, account appears legitimate
 * CAUTION: Medium risk, some suspicious indicators
 * DANGER: High risk, likely bot or impersonator
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
 * Complete trust assessment report containing score, verdict, and risk flags.
 * Flags are immutable array of human-readable risk indicators.
 */
export interface TrustReport {
  readonly userInfo: UserInfo;
  readonly score: number; // 0-100, where 100 is most trustworthy
  readonly verdict: TrustVerdict;
  readonly flags: readonly string[];
}
