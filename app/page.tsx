'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Shield, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TrustResults } from '@/components/TrustResults';
import { CreditModal } from '@/components/CreditModal';
import { AuthButton } from '@/components/AuthButton';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';
import type { TrustReport } from '@/types/trust';
import { verifyAccount } from '@/lib/fetch-utils';

/**
 * Main landing page with search and verification.
 *
 * Why sessionStorage + URL params? Users refresh pages. Persisting search state
 * prevents losing results. URL params enable shareable links; sessionStorage
 * provides instant restoration without API calls.
 */
export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReport | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [freeLookupsRemaining, setFreeLookupsRemaining] = useState<number | null>(null);

  const supabase = createClient();

  // Load user session, credits, free lookups, and restore search state on mount
  useEffect(() => {
    // Restore username from URL params
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get('q');
    if (urlUsername) {
      setUsername(urlUsername);
    }

    // Restore report from sessionStorage if available
    const storedReport = sessionStorage.getItem('lastTrustReport');
    if (storedReport) {
      // Parse and validate stored report functionally
      let parsed: unknown;
      try {
        parsed = JSON.parse(storedReport);
      } catch {
        // Invalid JSON, remove corrupted data
        sessionStorage.removeItem('lastTrustReport');
        return;
      }

      // Basic validation - check if it has required TrustReport fields
      // Using type guard pattern instead of type assertion
      const isValidTrustReport = (
        data: unknown
      ): data is TrustReport => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'userInfo' in data &&
          'score' in data &&
          'verdict' in data &&
          'flags' in data &&
          typeof (data as { score: unknown }).score === 'number' &&
          typeof (data as { verdict: unknown }).verdict === 'string' &&
          Array.isArray((data as { flags: unknown }).flags)
        );
      };

      if (isValidTrustReport(parsed)) {
        // Only restore if it matches the current search
        if (urlUsername && parsed.userInfo.username.toLowerCase() === urlUsername.toLowerCase().replace(/^@+/, '')) {
          setReport(parsed);
        }
      } else {
        // Invalid structure, remove corrupted data
        sessionStorage.removeItem('lastTrustReport');
      }
    }

    // Load free lookups from localStorage (only as cache, server is source of truth)
    // Don't initialize to 3 - server tracks by IP and is the authoritative source
    const storedFreeLookups = localStorage.getItem('freeLookupsRemaining');
    if (storedFreeLookups !== null) {
      const parsed = parseInt(storedFreeLookups, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        setFreeLookupsRemaining(parsed);
      }
    }
    // If not in localStorage, leave as null - will be set from server response

    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        // Fetch credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          setCredits(profile.credits);
        }
      } else {
        // For unauthenticated users, check remaining free lookups from server
        try {
          const response = await fetch('/api/verify', { method: 'GET' });
          if (response.ok) {
            const data = await response.json();
            if (typeof data.remainingFreeLookups === 'number') {
              setFreeLookupsRemaining(data.remainingFreeLookups);
              localStorage.setItem('freeLookupsRemaining', data.remainingFreeLookups.toString());
            }
          }
        } catch (error) {
          console.error('Failed to check free lookups:', error);
          // Silently fail - will be updated on next verification
        }
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);

          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setCredits(profile.credits);
          }
        } else {
          setUser(null);
          setCredits(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Check for checkout success/cancel in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');

    if (checkoutStatus === 'success') {
      // Refresh credits after successful payment
      if (user) {
        supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setCredits(profile.credits);
            }
          });
      }

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, supabase]);

  const handleVerify = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    // Strip @ sign if present
    const cleanUsername = username.trim().replace(/^@+/, '');

    const result = await verifyAccount(cleanUsername);

    if (result.isErr()) {
      const errorMessage = result.error.message;

      if (errorMessage === 'INSUFFICIENT_CREDITS') {
        setError('Insufficient credits. Please purchase more credits to continue.');
        setShowCreditModal(true);
      } else if (errorMessage === 'ACCOUNT_NOT_FOUND') {
        setError('Account not found. Please check the username and try again.');
      } else if (errorMessage === 'AUTH_REQUIRED' || errorMessage === 'UNAUTHORIZED') {
        setError('Free lookups exhausted. Please sign in to continue.');
        // Free lookups exhausted - update count to 0
        setFreeLookupsRemaining(0);
        localStorage.setItem('freeLookupsRemaining', '0');
        // Show credit modal to prompt sign-in and payment
        setShowCreditModal(true);
      } else {
        setError(errorMessage || 'An error occurred');
      }
      setLoading(false);
      return;
    }

    const trustReport = result.value;

    // Update free lookups if response includes remaining count (for unauthenticated users)
    if ('remainingFreeLookups' in trustReport && typeof (trustReport as { remainingFreeLookups?: number }).remainingFreeLookups === 'number') {
      const remaining = (trustReport as { remainingFreeLookups: number }).remainingFreeLookups;
      setFreeLookupsRemaining(remaining);
      localStorage.setItem('freeLookupsRemaining', remaining.toString());
    }

    // Update UI immediately
    setReport(trustReport);
    setLoading(false);

    // Update URL with search query
    const url = new URL(window.location.href);
    url.searchParams.set('q', cleanUsername);
    window.history.pushState({}, '', url.toString());

    // Store report in sessionStorage for persistence
    sessionStorage.setItem('lastTrustReport', JSON.stringify(trustReport));

    // Refresh credits asynchronously in the background (don't block UI)
    if (user) {
      void Promise.resolve(
        supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
      )
        .then(({ data: profile, error }) => {
          if (error) {
            console.error('Failed to refresh credits:', error);
            return;
          }
          if (profile) {
            setCredits(profile.credits);
          }
        })
        .catch((err) => {
          console.error('Failed to refresh credits:', err);
        });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Auth Button */}
        <div className="flex justify-end mb-8">
          <AuthButton />
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
            Verify the trustworthiness of X (Twitter) accounts using advanced metadata analysis
          </p>
        </div>

        {/* Credits/Free Lookups Display */}
        {user && credits !== null ? (
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-300 text-sm">
                <span className="font-semibold text-emerald-400">{credits}</span> credits
              </span>
            </div>
            <button
              onClick={() => setShowCreditModal(true)}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Buy Credits
            </button>
          </div>
        ) : freeLookupsRemaining !== null ? (
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm">
                <span className="font-semibold text-blue-400">{freeLookupsRemaining}</span> free {freeLookupsRemaining === 1 ? 'lookup' : 'lookups'} remaining
              </span>
            </div>
            {freeLookupsRemaining === 0 && (
              <button
                onClick={() => setShowCreditModal(true)}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In to Continue
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
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
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
          user={user}
        />

        {/* Footer */}
        <Footer />
      </div>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}

