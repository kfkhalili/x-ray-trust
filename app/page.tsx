"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Shield, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TrustResults } from "@/components/TrustResults";
import { CreditModal } from "@/components/CreditModal";
import { AuthButton } from "@/components/AuthButton";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import type { TrustReport } from "@/types/trust";
import { verifyAccount } from "@/lib/fetch-utils";
import type { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Countdown component for free lookup reset timer.
 * Shows "Next lookup available in X minutes" and updates every second.
 */
/**
 * Countdown component for free lookup reset timer.
 * Shows "Next lookup available in X minutes" and updates every second.
 *
 * nextResetTime is in milliseconds remaining (not absolute timestamp).
 */
const FreeLookupCountdown = ({
  nextResetTime,
  onReset,
}: {
  nextResetTime: number | null;
  onReset: () => void;
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (nextResetTime === null) {
      setTimeRemaining(null);
      return;
    }

    // nextResetTime is milliseconds remaining, so we start with that
    setTimeRemaining(nextResetTime);

    // Update every second by decrementing
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          onReset(); // Trigger refresh when countdown reaches zero
          return 0;
        }
        return prev - 1000; // Decrement by 1 second
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResetTime, onReset]);

  if (timeRemaining === null || timeRemaining <= 0) {
    return (
      <span className="text-gray-300 text-sm">
        <span className="font-semibold text-blue-400">3</span> free lookups
        available
      </span>
    );
  }

  const minutes = Math.floor(timeRemaining / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  return (
    <span className="text-gray-300 text-sm">
      Next lookup available in{" "}
      <span className="font-semibold text-blue-400">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </span>
  );
};

/**
 * Main landing page with search and verification.
 *
 * Why sessionStorage + URL params? Users refresh pages. Persisting search state
 * prevents losing results. URL params enable shareable links; sessionStorage
 * provides instant restoration without API calls.
 */
export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReport | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [freeLookupsRemaining, setFreeLookupsRemaining] = useState<
    number | null
  >(null);
  const [nextResetTime, setNextResetTime] = useState<number | null>(null);
  // Track current subscription to cleanup on unmount or username change
  const subscriptionRef = useRef<ReturnType<SupabaseClient['channel']> | null>(
    null
  );

  const supabaseResult = createClient();
  if (supabaseResult.isErr()) {
    console.error('Failed to create Supabase client:', supabaseResult.error);
    // In development, this should never happen - fail fast
    throw supabaseResult.error;
  }
  const supabase = supabaseResult.value;

  // Ref to track if we're currently fetching credits (prevents race conditions)
  const fetchingCreditsRef = useRef(false);

  // Single function to fetch credits - prevents race conditions
  const fetchCredits = useCallback(
    async (userId: string) => {
      // Prevent concurrent fetches
      if (fetchingCreditsRef.current) {
        return;
      }

      fetchingCreditsRef.current = true;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (profile) {
          setCredits(profile.credits);
        } else if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist (404) - default to 0 credits
          setCredits(0);
          console.warn(
            "Profile not found for user:",
            userId,
            "- trigger may not have run"
          );
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        fetchingCreditsRef.current = false;
      }
    },
    [supabase]
  );

  // Load user session, credits, free lookups, and restore search state on mount
  useEffect(() => {
    // Check if user landed on wrong domain after OAuth error
    // Supabase sometimes redirects to production (site_url) instead of localhost (referrer)
    // This happens especially when the state parameter is missing (bad_oauth_callback error)
    const params = new URLSearchParams(window.location.search);
    const hasOAuthError = params.has("error") && params.has("error_code");
    const errorCode = params.get("error_code");
    const errorDescription = params.get("error_description");
    const storedOrigin = sessionStorage.getItem("oauth_origin");

    // Log OAuth errors for debugging
    if (hasOAuthError) {
      console.error("OAuth error detected:", {
        error: params.get("error"),
        errorCode,
        errorDescription,
        currentOrigin: window.location.origin,
        storedOrigin,
        isWrongDomain: storedOrigin && storedOrigin !== window.location.origin,
      });
    }

    // Handle redirect if user landed on wrong domain after OAuth error
    // This is critical for "bad_oauth_callback" errors where state parameter is missing
    if (hasOAuthError && storedOrigin && storedOrigin !== window.location.origin) {
      // User started OAuth on a different origin (e.g., localhost) but landed on production
      // Redirect them back to the original origin with the error params
      const redirectUrl = new URL(window.location.pathname, storedOrigin);
      redirectUrl.search = window.location.search;
      console.log("🔄 Redirecting back to original origin after OAuth error:", {
        from: window.location.origin,
        to: storedOrigin,
        error: params.get("error"),
        errorCode,
        errorDescription,
      });
      window.location.href = redirectUrl.toString();
      return; // Don't continue with other initialization
    }

    // Also handle the case where we're on production but should be on localhost
    // Check if this is a localhost development scenario (no NEXT_PUBLIC_APP_URL in client)
    // and we have an OAuth error - redirect to localhost if storedOrigin indicates localhost
    if (
      hasOAuthError &&
      !storedOrigin &&
      window.location.origin.includes("xtrustradar.com") &&
      errorCode === "bad_oauth_callback"
    ) {
      // This might be a case where sessionStorage was cleared but we're on production
      // Try to redirect to localhost:3000 if that's where development is happening
      // This is a fallback for when state parameter is missing and sessionStorage is lost
      const localhostOrigin = "http://localhost:3000";
      console.warn(
        "⚠️ OAuth error on production without stored origin, attempting localhost redirect:",
        {
          errorCode,
          errorDescription,
          attemptingRedirect: localhostOrigin,
        }
      );
      // Only redirect if we're confident this is a development scenario
      // (e.g., if there's a way to detect this, or if user explicitly wants this)
      // For now, we'll log and let the user handle it manually
    }

    // Clear stored origin if we're on the correct domain (successful redirect)
    if (storedOrigin === window.location.origin) {
      sessionStorage.removeItem("oauth_origin");
    }

    // Restore username from URL params
    const urlUsername = params.get("q");
    if (urlUsername) {
      setUsername(urlUsername);
    }

    // Restore report from sessionStorage if available
    const storedReport = sessionStorage.getItem("lastTrustReport");
    if (storedReport) {
      // Parse and validate stored report functionally
      let parsed: unknown;
      try {
        parsed = JSON.parse(storedReport);
      } catch {
        // Invalid JSON, remove corrupted data
        sessionStorage.removeItem("lastTrustReport");
        return;
      }

      // Basic validation - check if it has required TrustReport fields
      // Using type guard pattern instead of type assertion
      const isValidTrustReport = (data: unknown): data is TrustReport => {
        return (
          typeof data === "object" &&
          data !== null &&
          "userInfo" in data &&
          "score" in data &&
          "verdict" in data &&
          "flags" in data &&
          typeof (data as { score: unknown }).score === "number" &&
          typeof (data as { verdict: unknown }).verdict === "string" &&
          Array.isArray((data as { flags: unknown }).flags)
        );
      };

      if (isValidTrustReport(parsed)) {
        // Only restore if it matches the current search
        if (
          urlUsername &&
          parsed.userInfo.username.toLowerCase() ===
            urlUsername.toLowerCase().replace(/^@+/, "")
        ) {
          setReport(parsed);
        }
      } else {
        // Invalid structure, remove corrupted data
        sessionStorage.removeItem("lastTrustReport");
      }
    }

    // Load free lookups from localStorage (only as cache, server is source of truth)
    // Don't initialize to 3 - server tracks by IP and is the authoritative source
    const storedFreeLookups = localStorage.getItem("freeLookupsRemaining");
    if (storedFreeLookups !== null) {
      const parsed = parseInt(storedFreeLookups, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        setFreeLookupsRemaining(parsed);
      }
    }
    // If not in localStorage, leave as null - will be set from server response

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        // Authenticated users also get free lookups (tracked by IP)
        // Fetch free lookups from server
        try {
          const response = await fetch("/api/verify", { method: "GET" });
          if (response.ok) {
            const data = await response.json();
            if (typeof data.remainingFreeLookups === "number") {
              setFreeLookupsRemaining(data.remainingFreeLookups);
            }
            if (
              typeof data.nextResetTime === "number" ||
              data.nextResetTime === null
            ) {
              setNextResetTime(data.nextResetTime);
            }
          }
        } catch (error) {
          console.error("Failed to check free lookups:", error);
        }

        // Fetch credits using centralized function
        await fetchCredits(currentUser.id);
      } else {
        // For unauthenticated users, check remaining free lookups from server
        try {
          const response = await fetch("/api/verify", { method: "GET" });
          if (response.ok) {
            const data = await response.json();
            if (typeof data.remainingFreeLookups === "number") {
              setFreeLookupsRemaining(data.remainingFreeLookups);
              localStorage.setItem(
                "freeLookupsRemaining",
                data.remainingFreeLookups.toString()
              );
            }
            if (
              typeof data.nextResetTime === "number" ||
              data.nextResetTime === null
            ) {
              setNextResetTime(data.nextResetTime);
            }
          }
        } catch (error) {
          console.error("Failed to check free lookups:", error);
          // Silently fail - will be updated on next verification
        }
      }
    };

    loadUser();

    // Check for successful OAuth redirect and refresh auth state
    const authParams = new URLSearchParams(window.location.search);
    if (authParams.get("auth") === "success") {
      // Coming from successful OAuth - refresh user state
      setTimeout(loadUser, 100);
      setTimeout(loadUser, 500);
      // Clean the URL param
      window.history.replaceState({}, "", window.location.pathname);

      // If user wanted to buy credits, auto-open modal after sign-in
      setShowSignInModal(false); // Close sign-in modal
      const shouldOpenCredits =
        sessionStorage.getItem("openCreditsAfterSignIn") === "true";
      if (shouldOpenCredits) {
        setTimeout(() => {
          sessionStorage.removeItem("openCreditsAfterSignIn");
          setShowCreditModal(true);
        }, 1000); // Wait for user and credits to load
      }
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const wasUnauthenticated = !user; // Track if user just signed in
        setUser(session.user);
        // Authenticated users also get free lookups (tracked by IP)
        // Fetch free lookups from server
        try {
          const response = await fetch("/api/verify", { method: "GET" });
          if (response.ok) {
            const data = await response.json();
            if (typeof data.remainingFreeLookups === "number") {
              setFreeLookupsRemaining(data.remainingFreeLookups);
            }
            if (
              typeof data.nextResetTime === "number" ||
              data.nextResetTime === null
            ) {
              setNextResetTime(data.nextResetTime);
            }
          }
        } catch (error) {
          console.error("Failed to check free lookups:", error);
        }

        // Fetch credits using centralized function
        await fetchCredits(session.user.id);

        // If user just signed in, close sign-in modal and check if they wanted to buy credits
        if (wasUnauthenticated) {
          setShowSignInModal(false); // Close sign-in modal
          const shouldOpenCredits =
            sessionStorage.getItem("openCreditsAfterSignIn") === "true";
          if (shouldOpenCredits) {
            sessionStorage.removeItem("openCreditsAfterSignIn");
            // Small delay to ensure credits are loaded
            setTimeout(() => {
              setShowCreditModal(true);
            }, 300);
          }
        }
      } else {
        setUser(null);
        setCredits(null);
        // When user signs out, fetch free lookups for unauthenticated state
        const response = await fetch("/api/verify", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.remainingFreeLookups === "number") {
            setFreeLookupsRemaining(data.remainingFreeLookups);
            localStorage.setItem(
              "freeLookupsRemaining",
              data.remainingFreeLookups.toString()
            );
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      // Cleanup Realtime subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [supabase, fetchCredits]);

  // Check for checkout success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");

    if (checkoutStatus === "success") {
      // Refresh credits after successful payment using centralized function
      if (user) {
        fetchCredits(user.id).catch((err) => {
          console.error("Failed to refresh credits after checkout:", err);
        });
      }

      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user, fetchCredits]);

  /**
   * Sets up Realtime subscription to listen for verification updates.
   *
   * Why Realtime? When multiple users request the same username simultaneously,
   * only one API call is made. Other clients subscribe to get the result when it's ready.
   */
  const setupRealtimeSubscription = (normalizedUsername: string) => {
    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to updates for this specific username
    const channel = supabase
      .channel(`verification:${normalizedUsername}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "verifications",
          filter: `username=eq.${normalizedUsername}`,
        },
        (payload) => {
          // When verification is updated (status changes from 'pending' to 'completed')
          if (payload.new.status === "completed" && payload.new.trust_report) {
            const updatedReport = payload.new.trust_report as TrustReport;
            setReport(updatedReport);
            setLoading(false);

            // Update sessionStorage
            sessionStorage.setItem(
              "lastTrustReport",
              JSON.stringify(updatedReport)
            );
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  };

  const handleVerify = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    // Strip @ sign if present and normalize
    const cleanUsername = username.trim().replace(/^@+/, "");
    const normalizedUsername = cleanUsername.toLowerCase();

    // No dampening - user can click as often as they want
    // API will handle caching and return immediately if data is fresh
    setLoading(true);
    setError(null);

    // Set up Realtime subscription to listen for updates
    // This handles the case where another request is already fetching this username
    setupRealtimeSubscription(normalizedUsername);

    try {
      const result = await verifyAccount(cleanUsername);

      if (result.isErr()) {
        const errorMessage = result.error.message;

        if (errorMessage === "INSUFFICIENT_CREDITS") {
          // Check if error includes nextResetTime for countdown
          const errorWithResetTime = result.error as Error & {
            nextResetTime?: number | null;
          };
          if (errorWithResetTime.nextResetTime !== undefined) {
            setNextResetTime(errorWithResetTime.nextResetTime);
          }
          setError(
            "Insufficient credits and free lookups exhausted. Please purchase more credits or wait for free lookups to reset."
          );
          setShowCreditModal(true);
        } else if (errorMessage === "RATE_LIMIT_EXCEEDED") {
          setError("Rate limit exceeded. Please wait a moment and try again.");
        } else if (errorMessage === "ACCOUNT_NOT_FOUND") {
          setError(
            "Account not found. Please check the username and try again."
          );
        } else if (
          errorMessage === "AUTH_REQUIRED" ||
          errorMessage === "UNAUTHORIZED"
        ) {
          setError("Free lookups exhausted. Please sign in to continue.");
          // Free lookups exhausted - update count to 0
          setFreeLookupsRemaining(0);
          localStorage.setItem("freeLookupsRemaining", "0");
          // Track that user wants to buy credits - will auto-open modal after sign-in
          sessionStorage.setItem("openCreditsAfterSignIn", "true");
          // Open sign-in modal directly (user needs to sign in to buy credits)
          setShowSignInModal(true);
        } else if (errorMessage === "PENDING") {
          // Verification is in progress - Realtime will update when ready
          setError(null); // No error, just waiting
          // Keep loading state - Realtime subscription will update when ready
          return;
        } else {
          setError(errorMessage || "An error occurred");
        }
        setLoading(false);
        return;
      }

      const trustReport = result.value;

      // Update free lookups if response includes remaining count
      if (
        "remainingFreeLookups" in trustReport &&
        typeof (trustReport as { remainingFreeLookups?: number })
          .remainingFreeLookups === "number"
      ) {
        const remaining = (trustReport as { remainingFreeLookups: number })
          .remainingFreeLookups;
        setFreeLookupsRemaining(remaining);
        localStorage.setItem("freeLookupsRemaining", remaining.toString());

        // Update next reset time if provided
        if ("nextResetTime" in trustReport) {
          const resetTime = (trustReport as { nextResetTime?: number | null })
            .nextResetTime;
          if (typeof resetTime === "number" || resetTime === null) {
            setNextResetTime(resetTime);
          }
        }
      }

      // Update UI immediately (could be cached or fresh data)
      setReport(trustReport);
      setLoading(false);

      // Update URL with search query
      const url = new URL(window.location.href);
      url.searchParams.set("q", cleanUsername);
      window.history.pushState({}, "", url.toString());

      // Store report in sessionStorage for persistence
      sessionStorage.setItem("lastTrustReport", JSON.stringify(trustReport));

      // Refresh credits asynchronously in the background (don't block UI)
      if (user) {
        fetchCredits(user.id).catch((err) => {
          console.error("Failed to refresh credits after verification:", err);
        });
      }
    } catch (error) {
      // Handle unexpected errors (network failures, etc.)
      console.error("Unexpected error during verification:", error);
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Auth Button */}
        <div className="flex justify-end mb-8">
          <AuthButton
            forceShowSignIn={showSignInModal}
            onSignInModalClose={() => setShowSignInModal(false)}
          />
        </div>

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

        {/* Credits/Free Lookups Display */}
        {user ? (
          // Authenticated users: show credits and free lookups
          credits !== null ? (
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              {/* Credits Display */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                {credits > 0 ? (
                  <span className="text-gray-300 text-sm">
                    <span className="font-semibold text-emerald-400">
                      {credits}
                    </span>{" "}
                    credits
                  </span>
                ) : (
                  <span className="text-gray-300 text-sm">
                    <span className="font-semibold text-emerald-400">0</span>{" "}
                    credits
                  </span>
                )}
              </div>

              {/* Free Lookups Display (authenticated users also get free lookups) */}
              {freeLookupsRemaining !== null && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  {freeLookupsRemaining > 0 ? (
                    <span className="text-gray-300 text-sm">
                      <span className="font-semibold text-blue-400">
                        {freeLookupsRemaining}
                      </span>{" "}
                      free {freeLookupsRemaining === 1 ? "lookup" : "lookups"}
                    </span>
                  ) : (
                    <FreeLookupCountdown
                      nextResetTime={nextResetTime}
                      onReset={() => {
                        // Refresh free lookups when countdown reaches zero
                        fetch("/api/verify", { method: "GET" })
                          .then((res) => res.json())
                          .then((data) => {
                            if (typeof data.remainingFreeLookups === "number") {
                              setFreeLookupsRemaining(
                                data.remainingFreeLookups
                              );
                              setNextResetTime(data.nextResetTime);
                            }
                          })
                          .catch(console.error);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Buy Credits Button */}
              <button
                onClick={() => setShowCreditModal(true)}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Buy Credits
              </button>
            </div>
          ) : null // Show nothing while credits are loading
        ) : freeLookupsRemaining !== null ? (
          // Unauthenticated users: show free lookups
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              {freeLookupsRemaining > 0 ? (
                <span className="text-gray-300 text-sm">
                  <span className="font-semibold text-blue-400">
                    {freeLookupsRemaining}
                  </span>{" "}
                  free {freeLookupsRemaining === 1 ? "lookup" : "lookups"}{" "}
                  remaining
                </span>
              ) : (
                <FreeLookupCountdown
                  nextResetTime={nextResetTime}
                  onReset={() => {
                    // Refresh free lookups when countdown reaches zero
                    fetch("/api/verify", { method: "GET" })
                      .then((res) => res.json())
                      .then((data) => {
                        if (typeof data.remainingFreeLookups === "number") {
                          setFreeLookupsRemaining(data.remainingFreeLookups);
                          setNextResetTime(data.nextResetTime);
                        }
                      })
                      .catch(console.error);
                  }}
                />
              )}
            </div>
            {freeLookupsRemaining === 0 && (
              <button
                onClick={() => {
                  // Track that user wants to buy credits - will auto-open modal after sign-in
                  sessionStorage.setItem("openCreditsAfterSignIn", "true");
                  // Open sign-in modal directly (user wants to buy, so they need to sign in)
                  setShowSignInModal(true);
                }}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Buy More Lookups
              </button>
            )}
          </div>
        ) : null}

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

        {/* Credit Modal */}
        <CreditModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          currentCredits={credits ?? 0}
          user={user ?? undefined}
        />

        {/* Footer */}
        <Footer />
      </div>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
