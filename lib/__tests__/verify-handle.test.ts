import { verifyHandle, type LookupDeps } from "@/lib/verify-handle";
import type { ProviderResult } from "@/lib/x-provider";
import type { XRawData, TrustReport } from "@/types/trust";

const rawData: XRawData = {
  id: "1",
  created_at: "Tue Jun 02 20:12:29 +0000 2009",
  blue_verified: true,
  followers_count: 1000,
  friends_count: 100,
  _userInfo: {
    id: "1",
    username: "bob",
    name: "Bob",
    createdAt: "Tue Jun 02 20:12:29 +0000 2009",
    blueVerified: true,
  },
};

const someReport: TrustReport = {
  userInfo: rawData._userInfo!,
  score: 50,
  verdict: "CAUTION",
  flags: [],
};

/** Builds LookupDeps from fakes plus spies to assert what the policy touched. */
const makeDeps = (opts: {
  cached?: TrustReport | null;
  allow?: boolean;
  budget?: number;
  providerResult?: ProviderResult;
} = {}) => {
  const spies = { providerCalls: 0, budgetRecords: 0, cacheSets: 0 };
  const deps: LookupDeps = {
    cache: {
      get: () => opts.cached ?? null,
      set: () => {
        spies.cacheSets++;
      },
    },
    rateLimiter: { allow: () => opts.allow ?? true },
    budget: {
      remaining: () => opts.budget ?? 950,
      record: () => {
        spies.budgetRecords++;
      },
    },
    provider: {
      fetchAccountData: async () => {
        spies.providerCalls++;
        return opts.providerResult ?? { kind: "ok", data: rawData, billed: true };
      },
    },
  };
  return { deps, spies };
};

describe("verifyHandle — lookup policy", () => {
  it("cache hit → ok/cached, never touches provider or budget", async () => {
    const { deps, spies } = makeDeps({ cached: someReport });
    const out = await verifyHandle("@Bob", "ip", deps);
    expect(out).toEqual({ status: "ok", report: someReport, cached: true });
    expect(spies.providerCalls).toBe(0);
    expect(spies.budgetRecords).toBe(0);
  });

  it("over rate limit → rate_limited, no provider call", async () => {
    const { deps, spies } = makeDeps({ allow: false });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("rate_limited");
    expect(spies.providerCalls).toBe(0);
  });

  it("over budget → at_capacity, no provider call, no charge", async () => {
    const { deps, spies } = makeDeps({ budget: 0 });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("at_capacity");
    expect(spies.providerCalls).toBe(0);
    expect(spies.budgetRecords).toBe(0);
  });

  it("a billed provider result charges the budget", async () => {
    const { deps, spies } = makeDeps({
      providerResult: { kind: "not_found", billed: true },
    });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("not_found");
    expect(spies.budgetRecords).toBe(1);
  });

  it("an un-billed failure (network) does not charge the budget", async () => {
    const { deps, spies } = makeDeps({
      providerResult: { kind: "upstream_error", billed: false },
    });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("upstream_error");
    expect(spies.budgetRecords).toBe(0);
  });

  it("ok result → scores and caches", async () => {
    const { deps, spies } = makeDeps({
      providerResult: { kind: "ok", data: rawData, billed: true },
    });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("ok");
    if (out.status === "ok") {
      expect(out.cached).toBe(false);
      expect(out.report.userInfo.username).toBe("bob");
    }
    expect(spies.cacheSets).toBe(1);
    expect(spies.budgetRecords).toBe(1);
  });

  it("config_error passes through", async () => {
    const { deps } = makeDeps({
      providerResult: { kind: "config_error", billed: false },
    });
    const out = await verifyHandle("bob", "ip", deps);
    expect(out.status).toBe("config_error");
  });
});
