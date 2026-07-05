"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { Search, Loader2, Shield } from "lucide-react";
import { TrustResults } from "@/components/TrustResults";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import type { TrustReport } from "@/types/trust";
import { verifyAccount } from "@/lib/fetch-utils";

/**
 * Maps an API error code to a user-friendly message.
 * The API surfaces codes; the UI owns the wording.
 */
const messageForError = (code: string): string => {
  switch (code) {
    case "ACCOUNT_NOT_FOUND":
      return "Account not found. Please check the username and try again.";
    case "RATE_LIMIT_EXCEEDED":
      return "Too many lookups right now. Please wait a moment and try again.";
    case "SERVER_ERROR":
      return "Verification is temporarily unavailable (server configuration). Please try again later.";
    case "UPSTREAM_ERROR":
      return "The X data service is temporarily unavailable. Please try again in a moment.";
    default:
      return code || "An error occurred. Please try again.";
  }
};

/**
 * Landing page: a single search box that returns a trust report for an X handle.
 * No accounts, no credits — a free, stateless lookup.
 */
export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReport | null>(null);

  // Restore the last result on refresh within a session (nice-to-have).
  useEffect(() => {
    const stored = sessionStorage.getItem("lastTrustReport");
    if (!stored) return;
    try {
      setReport(JSON.parse(stored) as TrustReport);
    } catch {
      sessionStorage.removeItem("lastTrustReport");
    }
  }, []);

  const handleVerify = async () => {
    const cleanUsername = username.trim().replace(/^@+/, "");
    if (!cleanUsername) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyAccount(cleanUsername);
    setLoading(false);

    if (result.isErr()) {
      setError(messageForError(result.error.message));
      return;
    }

    setReport(result.value);
    sessionStorage.setItem("lastTrustReport", JSON.stringify(result.value));

    // Update URL for a shareable link.
    const url = new URL(window.location.href);
    url.searchParams.set("q", cleanUsername);
    window.history.pushState({}, "", url.toString());
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100">
            X Trust Radar
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Verify the trustworthiness of X (Twitter) accounts using advanced
            metadata analysis
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter X (Twitter) username (without @)"
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading || !username.trim()}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-8">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {report && <TrustResults report={report} />}

        {/* Footer */}
        <Footer />
      </div>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
