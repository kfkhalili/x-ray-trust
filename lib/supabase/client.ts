import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Uses @supabase/ssr for cookie-based auth that works seamlessly with Next.js
 * App Router. Cookies are managed automatically—no manual token handling needed.
 *
 * Note: createBrowserClient handles cookies automatically via browser's native
 * cookie handling. No manual cookie management needed.
 *
 * Supports both legacy anon keys (JWT format) and publishable keys (sb_publishable_...).
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
      'You can use either the legacy anon key (JWT format) or a publishable key (sb_publishable_...). ' +
      'Get your keys from: https://app.supabase.com/project/_/settings/api'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
};

