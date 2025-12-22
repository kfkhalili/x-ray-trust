import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client that bypasses RLS.
 *
 * Why bypass RLS? Webhooks run without user context—no auth cookies, no session.
 * RLS would block all operations. Service role key grants full database access,
 * so we only use this for verified server-to-server operations (Stripe webhooks).
 *
 * Defensive check: Throws if env vars missing to fail fast during development.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Defensive check: Fail fast if env vars missing
  // Prevents cryptic errors later when trying to use the client
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

