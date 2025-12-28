import { createBrowserClient } from '@supabase/ssr';
import { Result, ok, err } from 'neverthrow';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 *
 * Returns Result type for functional error handling instead of throwing.
 */
export const createClient = (): Result<SupabaseClient, Error> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return err(
      new Error(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
        'You can use either the legacy anon key (JWT format) or a publishable key (sb_publishable_...). ' +
        'Get your keys from: https://app.supabase.com/project/_/settings/api'
      )
    );
  }

  const client = createBrowserClient(supabaseUrl, supabaseKey);
  return ok(client);
};

