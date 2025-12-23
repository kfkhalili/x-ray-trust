'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LogIn, LogOut, User } from 'lucide-react';

/**
 * Auth button with magic link sign-in and OAuth (Google, GitHub).
 *
 * Why magic links? No passwords to manage, reset, or leak. Email verification
 * is built-in. Users click link in email → authenticated. Simpler UX, better security.
 *
 * Why OAuth? Faster sign-in, no email required. Users trust Google/GitHub for auth.
 */
export const AuthButton = () => {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Check current session on mount and after redirects
    const checkUser = async () => {
      // Check both getUser and getSession to ensure we catch the session
      const [userResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      console.log('Checking user:', {
        user: userResult.data.user?.email || 'no user',
        session: sessionResult.data.session ? 'has session' : 'no session',
        error: userResult.error?.message || sessionResult.error?.message || 'none',
      });

      let currentUser = userResult.data.user || sessionResult.data.session?.user || null;

      // If browser client can't find session, try server-side check as fallback
      // This helps when cookies aren't immediately readable by browser client
      // The server can read cookies from request headers even if browser client can't
      if (!currentUser) {
        try {
          const serverResponse = await fetch('/api/auth/session', {
            credentials: 'include', // Ensure cookies are sent with request
          });
          if (serverResponse.ok) {
            const serverData = await serverResponse.json();
            if (serverData.user && serverData.session) {
              console.log('Found user via server-side check:', serverData.user.email);
              // Server has session but browser client can't read cookies
              // Trigger a refresh by calling getUser again after a short delay
              // This gives cookies time to be properly set/read
              setTimeout(async () => {
                const { data: { user: refreshedUser } } = await supabase.auth.getUser();
                if (refreshedUser) {
                  console.log('Browser client found user after delay:', refreshedUser.email);
                  setUser(refreshedUser);
                }
              }, 100);
              // Don't set currentUser here - let the retry handle it or onAuthStateChange will fire
              return;
            }
          }
        } catch (error) {
          console.error('Server-side session check failed:', error);
        }
      }

      if (currentUser) {
        console.log('Setting user:', currentUser.email);
        setUser(currentUser);
      } else {
        console.log('No user found');
        setUser(null);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setShowSignIn(false);
          setMessage(null);
          // Force a refresh of user data after sign in
          const { data: { user: updatedUser } } = await supabase.auth.getUser();
          if (updatedUser) {
            setUser(updatedUser);
          }
        }
      }
    );

    // Check auth state after OAuth redirect (callback completes and redirects to home)
    // Check multiple times to catch timing issues with cookie propagation
    const checkAfterRedirect = () => {
      // Check immediately
      checkUser();
      // Check again after short delays to catch any timing issues
      setTimeout(checkUser, 100);
      setTimeout(checkUser, 500);
      setTimeout(checkUser, 1000);
    };

    // If coming from OAuth callback (no error in URL), check auth state
    const params = new URLSearchParams(window.location.search);
    if (params.has('auth') && params.get('auth') === 'success') {
      // Coming from successful OAuth - check auth state immediately and clean URL
      checkAfterRedirect();
      // Clean the URL param after checking
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (!params.has('error') && !params.has('checkout')) {
      // Might be coming from successful OAuth - check auth state
      checkAfterRedirect();
    }

    // Also check on focus (user might have completed OAuth in another tab/window)
    const handleFocus = () => {
      checkUser();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the login link!');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessage(null);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setMessage(null);

    // Use NEXT_PUBLIC_APP_URL if set (for production), otherwise use current origin (for local dev)
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(null);
    }
    // If successful, user will be redirected to OAuth provider
    // Then redirected back to /auth/callback, then to home page
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  if (showSignIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">Sign In</h2>
            <button
              onClick={() => {
                setShowSignIn(false);
                setMessage(null);
              }}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-colors border border-gray-300"
              >
                {oauthLoading === 'google' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                disabled={!!oauthLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors border border-gray-700"
              >
                {oauthLoading === 'github' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-1.004-.013-1.845-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Continue with GitHub</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">or</span>
              </div>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('Check your email')
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!oauthLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowSignIn(true)}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
};

