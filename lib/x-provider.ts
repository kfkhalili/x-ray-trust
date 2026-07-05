import type { XRawData } from "@/types/trust";

/**
 * The result of a provider lookup.
 *
 * `billed` reports whether the request reached the upstream and therefore
 * counts against the paid plan quota: true for any HTTP response (including
 * 404 / 429 / 5xx), false for a missing key or a network failure. The caller
 * owns the budget; the provider only reports the billing truth.
 */
export type ProviderResult =
  | { kind: "ok"; data: XRawData; billed: boolean }
  | { kind: "not_found"; billed: boolean }
  | { kind: "rate_limited"; billed: boolean }
  | { kind: "upstream_error"; billed: boolean }
  | { kind: "config_error"; billed: false };

/**
 * Fetches raw X account data for a handle. This is the single seam tied to a
 * data provider — swap the adapter to change providers; nothing else moves.
 */
export interface AccountDataProvider {
  fetchAccountData(handle: string): Promise<ProviderResult>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Maps a RapidAPI (twitter241) user payload to XRawData. Pure — feed it a
 * captured response and assert the mapping.
 *
 * twitter241's current schema splits fields across `core` (created_at, name,
 * screen_name), `legacy` (follower/status counts, description), `privacy`
 * (protected) and `verification`, with the avatar under `avatar.image_url`.
 * Falls back to the older all-in-`legacy` shape so a schema change is less
 * likely to break the mapping. Returns null when no account is present.
 */
export const mapRawUser = (json: any): XRawData | null => {
  const r =
    json?.result?.data?.user?.result ??
    json?.data?.user?.result ??
    json?.user?.result ??
    json?.result ??
    json;
  if (!r || typeof r !== "object") return null;

  const legacy = r.legacy ?? {};
  const core = r.core ?? {};

  const screenName: string | undefined =
    core.screen_name ?? legacy.screen_name ?? r.screen_name;
  if (!screenName) return null;

  const id: string = r.rest_id ?? legacy.id_str ?? r.id_str ?? "";
  const createdAt: string = core.created_at ?? legacy.created_at ?? "";
  const blueVerified = Boolean(
    r.is_blue_verified ?? r.verification?.verified ?? legacy.verified ?? false
  );
  const followersCount: number | undefined =
    legacy.followers_count ?? r.followers_count;
  const friendsCount: number | undefined =
    legacy.friends_count ?? r.friends_count;

  return {
    id,
    created_at: createdAt,
    blue_verified: blueVerified,
    followers_count: followersCount,
    friends_count: friendsCount,
    listed_count: legacy.listed_count,
    statuses_count: legacy.statuses_count,
    media_count: legacy.media_count,
    favourites_count: legacy.favourites_count,
    protected: r.privacy?.protected ?? legacy.protected,
    _userInfo: {
      id,
      username: screenName,
      name: core.name ?? legacy.name ?? screenName,
      profilePicture: r.avatar?.image_url ?? legacy.profile_image_url_https,
      followersCount,
      followingCount: friendsCount,
      createdAt,
      blueVerified,
      description: legacy.description ?? r.description,
    },
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The twitter241 (RapidAPI) adapter — the only module that knows the provider's
 * host, headers, and response shape. Reads RAPIDAPI_KEY / RAPIDAPI_HOST unless
 * overridden (the key is read per call so a missing key surfaces as a config
 * error on each request).
 */
export const createTwitter241Provider = (opts?: {
  apiKey?: string;
  host?: string;
}): AccountDataProvider => {
  const host =
    opts?.host ?? process.env.RAPIDAPI_HOST ?? "twitter241.p.rapidapi.com";

  return {
    async fetchAccountData(handle: string): Promise<ProviderResult> {
      const apiKey = opts?.apiKey ?? process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        console.error("RAPIDAPI_KEY is not configured");
        return { kind: "config_error", billed: false };
      }

      let response: Response;
      try {
        response = await fetch(
          `https://${host}/user?username=${encodeURIComponent(handle)}`,
          { headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": host } }
        );
      } catch (error) {
        console.error("RapidAPI fetch error:", error);
        // Network / DNS / timeout — never reached the upstream, so not billed.
        return { kind: "upstream_error", billed: false };
      }

      // An HTTP response came back → this request is billed against the quota.
      const text = await response.text();

      if (!response.ok) {
        console.error("RapidAPI error:", response.status, text.slice(0, 300));
        if (response.status === 404) return { kind: "not_found", billed: true };
        if (response.status === 429)
          return { kind: "rate_limited", billed: true };
        return { kind: "upstream_error", billed: true };
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        console.error("Failed to parse RapidAPI response:", text.slice(0, 300));
        return { kind: "upstream_error", billed: true };
      }

      const data = mapRawUser(json);
      if (!data) return { kind: "not_found", billed: true };
      return { kind: "ok", data, billed: true };
    },
  };
};
