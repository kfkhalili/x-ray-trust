'use client';

import Link from 'next/link';

/**
 * Minimal footer with legal links.
 *
 * Why minimal? MVP focus. Full legal pages can be added later.
 * Essential links (Terms, Privacy, Cookies) for basic compliance.
 */
export const Footer = () => {
  return (
    <footer className="border-t border-gray-800 mt-16 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400">
          <span className="text-gray-500">© {new Date().getFullYear()} X-Ray Trust</span>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            href="/terms"
            className="hover:text-gray-300 transition-colors"
          >
            Terms of Service
          </Link>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            href="/privacy"
            className="hover:text-gray-300 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            href="/cookies"
            className="hover:text-gray-300 transition-colors"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

