import type { TrustReport } from "@/types/trust";
import { calculateTrust } from "@/lib/trust-engine";
import { normalizeHandle } from "@/lib/handle";
import type { AccountDataProvider } from "@/lib/x-provider";
import type { TrustCache, RateLimiter, Budget } from "@/lib/stores";

/** The domain outcome of a lookup, independent of HTTP. */
export type LookupOutcome =
  | { status: "ok"; report: TrustReport; cached: boolean }
  | { status: "not_found" }
  | { status: "rate_limited" }
  | { status: "at_capacity" }
  | { status: "config_error" }
  | { status: "upstream_error" };

export interface LookupDeps {
  provider: AccountDataProvider;
  cache: TrustCache;
  rateLimiter: RateLimiter;
  budget: Budget;
}

/**
 * The lookup policy, with no HTTP knowledge — the interface is the test surface.
 *
 * Order is the thing worth testing: a fresh cache hit costs nothing (no rate
 * limit, no budget, no provider call); only a cache miss consumes the IP rate
 * limit and the monthly budget; the budget guard refuses before any paid call;
 * and the budget is charged only for a request the provider actually billed.
 */
export const verifyHandle = async (
  rawHandle: string,
  clientIp: string,
  deps: LookupDeps
): Promise<LookupOutcome> => {
  const handle = normalizeHandle(rawHandle);

  const cached = deps.cache.get(handle);
  if (cached) return { status: "ok", report: cached, cached: true };

  if (!deps.rateLimiter.allow(clientIp)) return { status: "rate_limited" };

  if (deps.budget.remaining() <= 0) return { status: "at_capacity" };

  const result = await deps.provider.fetchAccountData(handle);
  if (result.billed) deps.budget.record();

  switch (result.kind) {
    case "config_error":
      return { status: "config_error" };
    case "not_found":
      return { status: "not_found" };
    case "rate_limited":
      return { status: "rate_limited" };
    case "upstream_error":
      return { status: "upstream_error" };
    case "ok": {
      const report = calculateTrust(result.data);
      deps.cache.set(handle, report);
      return { status: "ok", report, cached: false };
    }
  }
};
