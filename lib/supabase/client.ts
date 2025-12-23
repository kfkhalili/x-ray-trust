import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Uses @supabase/ssr for cookie-based auth that works seamlessly with Next.js
 * App Router. Cookies are managed automatically—no manual token handling needed.
 * 
 * Note: createBrowserClient handles cookies automatically via browser's native
 * cookie handling. No manual cookie management needed.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

