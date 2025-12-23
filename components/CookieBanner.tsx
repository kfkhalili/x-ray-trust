'use client';

import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

/**
 * Cookie consent banner for GDPR compliance.
 *
 * Why show this? GDPR and other privacy regulations require explicit consent
 * before setting non-essential cookies. We use cookies for authentication,
 * so we need user consent.
 */
export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-300 mb-1">
                We use <strong>essential cookies</strong> for authentication and session management.
                These cookies are required for the service to function. By continuing, you consent
                to our use of these essential cookies.
              </p>
              <p className="text-xs text-gray-400">
                Learn more in our{' '}
                <Link
                  href="/cookies"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  Cookie Policy
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  className="text-emerald-400 hover:text-emerald-300 underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

