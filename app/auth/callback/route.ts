import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

/**
 * OAuth callback handler for Supabase.
 *
 * Why this route? After OAuth (Google/GitHub), Supabase redirects here with
 * a code. We exchange the code for a session, then redirect to home.
 * Supabase handles the OAuth flow; we just complete the session setup.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication, redirect to home (or next URL)
      // Add a query param to signal successful auth so the client can refresh
      const redirectUrl = next.includes('?') ? `${next}&auth=success` : `${next}?auth=success`;
      redirect(redirectUrl);
    }
  }

  // If no code or error, redirect to home with error message
  redirect(`/?error=auth_failed`);
}
