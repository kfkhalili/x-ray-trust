'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Shield, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TrustResults } from '@/components/TrustResults';
import { CreditModal } from '@/components/CreditModal';
import { AuthButton } from '@/components/AuthButton';
import type { TrustReport } from '@/types/trust';

/**
 * Main landing page with search functionality and trust verification results.
 * Implements credit-based verification system with Stripe integration.
 */
export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TrustReport | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  // Load user session, credits, and restore search state on mount
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
      try {
        const parsedReport = JSON.parse(storedReport) as TrustReport;
        // Only restore if it matches the current search
        if (urlUsername && parsedReport.userInfo.username.toLowerCase() === urlUsername.toLowerCase().replace(/^@+/, '')) {
          setReport(parsedReport);
        }
      } catch (e) {
        // Invalid stored data, ignore
        sessionStorage.removeItem('lastTrustReport');
      }
    }

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

    if (!user) {
      setError('Please sign in to verify accounts');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    // Strip @ sign if present
    const cleanUsername = username.trim().replace(/^@+/, '');

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error: string; code: string };

        if (errorData.code === 'INSUFFICIENT_CREDITS') {
          setError('Insufficient credits. Please purchase more credits to continue.');
          setShowCreditModal(true);
        } else if (errorData.code === 'ACCOUNT_NOT_FOUND') {
          setError('Account not found. Please check the username and try again.');
        } else if (errorData.code === 'UNAUTHORIZED') {
          setError('Please sign in to verify accounts');
        } else {
          setError(errorData.error || 'An error occurred');
        }
        setLoading(false);
        return;
      }

      const trustReport = await response.json() as TrustReport;

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
        supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('Failed to refresh credits:', error);
              return;
            }
            if (profile) {
              setCredits(profile.credits);
            }
          });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
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
            X-Ray Trust
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Verify the trustworthiness of X (Twitter) accounts using advanced metadata analysis
          </p>
        </div>

        {/* Credits Display */}
        {user && credits !== null && (
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
        )}

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
        {user && (
          <CreditModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            currentCredits={credits ?? 0}
          />
        )}
      </div>
    </div>
  );
}

