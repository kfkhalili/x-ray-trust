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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { user: null, session: null, error: error?.message || "No session" },
      { status: 401 }
    );
  }

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

