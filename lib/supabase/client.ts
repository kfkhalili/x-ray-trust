import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for client-side operations.
 * Uses SSR package for consistent authentication handling across server and client.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

