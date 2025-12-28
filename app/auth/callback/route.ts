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

/**
 * Helper function to determine the correct redirect origin.
 * Priority: 1) Original redirect from state (if localhost), 2) Request origin (if localhost), 3) Production URL
 */
function getRedirectOrigin(
  requestUrl: URL,
  originalRedirectUrl: string | null,
  request: NextRequest
): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isRequestLocalhost =
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname.startsWith("192.168.") ||
    requestUrl.hostname.startsWith("10.");

  console.log("getRedirectOrigin called:", {
    requestOrigin: requestUrl.origin,
    requestHostname: requestUrl.hostname,
    isRequestLocalhost,
    originalRedirectUrl,
    hasForwardedHost: !!forwardedHost,
    hasForwardedProto: !!forwardedProto,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  // Priority 1: Use original redirect URL from state if it's localhost
  if (originalRedirectUrl && originalRedirectUrl.includes("localhost")) {
    try {
      const originalUrl = new URL(originalRedirectUrl);
      console.log(
        "✅ Priority 1: Using original localhost redirect from state:",
        originalUrl.origin
      );
      return originalUrl.origin;
    } catch (e) {
      console.warn("Failed to parse original redirect URL:", e);
    }
  }

  // Priority 2: If request is from localhost, use it
  if (isRequestLocalhost) {
    console.log(
      "✅ Priority 2: Using localhost from request:",
      requestUrl.origin
    );
    return requestUrl.origin;
  }

  // Priority 3: Production - use NEXT_PUBLIC_APP_URL or forwarded headers
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log(
      "✅ Priority 3: Using NEXT_PUBLIC_APP_URL:",
      process.env.NEXT_PUBLIC_APP_URL
    );
    return process.env.NEXT_PUBLIC_APP_URL;
  } else if (forwardedHost && forwardedProto) {
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    console.log("✅ Priority 3: Using forwarded headers:", forwardedOrigin);
    return forwardedOrigin;
  }

  console.log("⚠️ Fallback: Using request origin:", requestUrl.origin);
  return requestUrl.origin;
}

/**
 * Extract original redirect URL from Supabase state parameter.
 * Supabase encodes the redirect_to in the JWT state parameter.
 */
function extractOriginalRedirectUrl(state: string | null): string | null {
  if (!state) return null;

  try {
    // State is a JWT, decode it to get the referrer
    const parts = state.split(".");
    if (parts.length === 3) {
      // Decode base64url (JWT uses base64url, not base64)
      // Replace URL-safe base64 characters
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      // Add padding if needed
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(
        Buffer.from(padded, "base64").toString("utf-8")
      );
      // Check both 'referrer' and 'redirect_to' fields
      const originalRedirectUrl =
        payload.referrer || payload.redirect_to || null;
      console.log("Decoded state payload:", {
        referrer: payload.referrer,
        redirect_to: payload.redirect_to,
        site_url: payload.site_url,
        extracted: originalRedirectUrl,
      });
      return originalRedirectUrl;
    }
  } catch (e) {
    // If state decoding fails, ignore and use request origin
    console.warn("Failed to decode state parameter:", e);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");
  const next = requestUrl.searchParams.get("next") || "/";

  // Extract original redirect URL from state if available (for error cases)
  const originalRedirectUrl = extractOriginalRedirectUrl(state);

  // If we have an error and no code, handle it immediately
  if (error && !code) {
    console.error("OAuth error from provider:", {
      error,
      state,
      originalRedirectUrl,
      requestOrigin: requestUrl.origin,
      requestHostname: requestUrl.hostname,
    });

    const redirectOrigin = getRedirectOrigin(
      requestUrl,
      originalRedirectUrl,
      request
    );

    return NextResponse.redirect(
      new URL(
        `/?error=auth_failed&details=${encodeURIComponent(error)}`,
        redirectOrigin
      )
    );
  }

  if (code) {
    const supabaseResult = await createClient();
    if (supabaseResult.isErr()) {
      const redirectOrigin = getRedirectOrigin(
        requestUrl,
        originalRedirectUrl,
        request
      );
      return NextResponse.redirect(
        new URL(
          `/?error=auth_failed&details=${encodeURIComponent('Server configuration error')}`,
          redirectOrigin
        )
      );
    }
    const supabase = supabaseResult.value;
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Successful authentication, redirect to home (or next URL)
      // Add a query param to signal successful auth so the client can refresh
      // Using NextResponse.redirect() ensures cookies are set before redirect
      const redirectUrl = next.includes("?")
        ? `${next}&auth=success`
        : `${next}?auth=success`;

      // Determine the correct origin for redirect
      const redirectOrigin = getRedirectOrigin(
        requestUrl,
        originalRedirectUrl,
        request
      );

      // Create redirect response and ensure cookies are included
      const response = NextResponse.redirect(
        new URL(redirectUrl, redirectOrigin)
      );

      // Log success and cookie info for debugging
      const cookieStore = await import("next/headers").then((m) => m.cookies());
      const allCookies = await cookieStore.getAll();
      const supabaseCookies = allCookies.filter((c) =>
        c.name.startsWith("sb-")
      );

      const isRequestLocalhost =
        requestUrl.hostname === "localhost" ||
        requestUrl.hostname === "127.0.0.1" ||
        requestUrl.hostname.startsWith("192.168.") ||
        requestUrl.hostname.startsWith("10.");

      console.log("OAuth callback success:", {
        userId: data.session.user.id,
        email: data.session.user.email,
        hasSession: !!data.session,
        cookiesSet: supabaseCookies.length,
        cookieNames: supabaseCookies.map((c) => c.name),
        redirectOrigin,
        isLocalhost: isRequestLocalhost,
        originalRedirectUrl,
        requestOrigin: requestUrl.origin,
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
      // Determine redirect origin (same logic as success case)
      const redirectOrigin = getRedirectOrigin(
        requestUrl,
        originalRedirectUrl,
        request
      );

      return NextResponse.redirect(
        new URL(
          `/?error=auth_failed&details=${encodeURIComponent(
            error?.message || "unknown"
          )}`,
          redirectOrigin
        )
      );
    }
  }

  // If no code or error, redirect to home with error message
  const redirectOrigin = getRedirectOrigin(
    requestUrl,
    originalRedirectUrl,
    request
  );

  return NextResponse.redirect(new URL(`/?error=auth_failed`, redirectOrigin));
}
