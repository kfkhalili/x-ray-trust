import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Result, ok, err } from 'neverthrow';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client that bypasses RLS.
 *
 * Why bypass RLS? Webhooks run without user context—no auth cookies, no session.
 * RLS would block all operations. Service role key grants full database access,
 * so we only use this for verified server-to-server operations (Stripe webhooks).
 *
 * Returns Result type instead of throwing—functional error handling.
 */
export const createAdminClient = (): Result<SupabaseClient, Error> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Defensive check: Return error if env vars missing
  // Prevents cryptic errors later when trying to use the client
  if (!supabaseUrl || !serviceRoleKey) {
    return err(new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set'));
  }

  const client = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return ok(client);
};

