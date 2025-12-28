import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Result, ok, err } from 'neverthrow';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with cookie-based auth.
 *
 * Why async? Next.js 16 made cookies() async to support streaming responses.
 * This client reads/writes auth cookies automatically, enabling seamless
 * server-side authentication without manual cookie management.
 *
 * Returns Result type for functional error handling instead of throwing.
 */
export const createClient = async (): Promise<Result<SupabaseClient, Error>> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Defensive check: Return error if env vars missing
  // Prevents build-time errors when env vars aren't available
  if (!supabaseUrl || !supabaseAnonKey) {
    return err(
      new Error(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
        'You can use either the legacy anon key (JWT format) or a publishable key (sb_publishable_...). ' +
        'Get your keys from: https://app.supabase.com/project/_/settings/api'
      )
    );
  }

  const cookieStore = await cookies();

  const client = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  return ok(client);
};

