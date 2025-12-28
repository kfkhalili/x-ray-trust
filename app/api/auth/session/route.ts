import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Server-side session check endpoint.
 *
 * Why this route? After OAuth callback, the browser client might not immediately
 * read cookies. This endpoint allows the client to check the session server-side,
 * ensuring cookies are properly read from the request.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return NextResponse.json(
      { user: null, session: null, error: 'Server configuration error' },
      { status: 500 }
    );
  }
  const supabase = supabaseResult.value;
  const { data: { user }, error } = await supabase.auth.getUser();

  // No session is a valid state, not an error - return 200 OK
  // Supabase may return an error when there's no session, but that's expected
  if (!user) {
    return NextResponse.json(
      { user: null, session: null, error: null },
      { status: 200 }
    );
  }

  // If there's an error but we have a user, log it but still return success
  // This handles edge cases where Supabase returns both user and error
  if (error) {
    console.warn("Supabase getUser returned error but user exists:", error.message);
  }

  // User is authenticated
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      // Include other user fields as needed
    },
    session: true,
    error: null,
  });
}

