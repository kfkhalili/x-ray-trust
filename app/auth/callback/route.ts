import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth callback handler for Supabase.
 *
 * Why this route? After OAuth (Google/GitHub), Supabase redirects here with
 * a code. We exchange the code for a session, then redirect to home.
 * Supabase handles the OAuth flow; we just complete the session setup.
 *
 * Why NextResponse.redirect() instead of redirect()? We need to ensure cookies
 * are set in the response headers before redirecting. Using NextResponse allows
 * the cookie middleware to properly set auth cookies before the redirect happens.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Successful authentication, redirect to home (or next URL)
      // Add a query param to signal successful auth so the client can refresh
      // Using NextResponse.redirect() ensures cookies are set before redirect
      const redirectUrl = next.includes("?")
        ? `${next}&auth=success`
        : `${next}?auth=success`;

      // Create redirect response and ensure cookies are included
      const response = NextResponse.redirect(
        new URL(redirectUrl, requestUrl.origin)
      );

      // Log success and cookie info for debugging
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const allCookies = await cookieStore.getAll();
      const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
      
      console.log("OAuth callback success:", {
        userId: data.session.user.id,
        email: data.session.user.email,
        hasSession: !!data.session,
        cookiesSet: supabaseCookies.length,
        cookieNames: supabaseCookies.map(c => c.name),
      });

      return response;
    } else {
      // Log error for debugging
      console.error("OAuth callback error:", {
        error: error?.message,
        code: error?.code,
        status: error?.status,
        hasCode: !!code,
      });
      return NextResponse.redirect(
        new URL(
          `/?error=auth_failed&details=${encodeURIComponent(
            error?.message || "unknown"
          )}`,
          requestUrl.origin
        )
      );
    }
  }

  // If no code or error, redirect to home with error message
  return NextResponse.redirect(
    new URL(`/?error=auth_failed`, requestUrl.origin)
  );
}
