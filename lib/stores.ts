import type { TrustReport } from "@/types/trust";

/**
 * Ephemeral state behind small interfaces so the lookup policy can be tested
 * with fakes and a controlled clock.
 *
 * NOTE (candidate 3, deferred): these adapters are in-memory — they reset on
 * restart and are per-instance on serverless. That's fine for an MVP. A durable
 * shared version (Vercel KV / Upstash) is a *future* second adapter behind these
 * same interfaces; it is not built yet because a single adapter would make the
 * seam shallow (interface ≈ implementation). Build it when KV is real.
 */

/** A TTL result cache keyed by handle. */
export interface TrustCache {
  get(key: string): TrustReport | null;
  set(key: string, report: TrustReport): void;
}

/** A per-key sliding-window rate limit. */
export interface RateLimiter {
  /** Records an attempt; returns false if the key is over its limit. */
  allow(key: string): boolean;
}

/** A capped, self-resetting monthly call budget. */
export interface Budget {
  remaining(): number;
  record(): void;
}

export const createMemoryCache = (
  ttlMs: number,
  now: () => number = Date.now
): TrustCache => {
  const entries = new Map<string, { report: TrustReport; expires: number }>();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (now() > entry.expires) {
        entries.delete(key);
        return null;
      }
      return entry.report;
    },
    set(key, report) {
      entries.set(key, { report, expires: now() + ttlMs });
    },
  };
};

export const createMemoryRateLimiter = (
  windowMs: number,
  max: number,
  now: () => number = Date.now
): RateLimiter => {
  const hits = new Map<string, number[]>();
  return {
    allow(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
};

export const createMonthlyBudget = (
  limit: number,
  now: () => Date = () => new Date()
): Budget => {
  let month = "";
  let used = 0;
  const sync = () => {
    const d = now();
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (key !== month) {
      month = key;
      used = 0;
    }
  };
  return {
    remaining() {
      sync();
      return Math.max(0, limit - used);
    },
    record() {
      sync();
      used += 1;
    },
  };
};
