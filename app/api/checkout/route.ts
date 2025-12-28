import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, CREDIT_PACKS } from '@/lib/stripe';
import { Result, ok, err } from 'neverthrow';
import type Stripe from 'stripe';
import { isCreditsRequest } from '@/lib/validation';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';

/**
 * Error response type for API errors.
 */
type ErrorResponse = {
  error: string;
  code: string;
};

/**
 * POST /api/checkout — creates Stripe Checkout session.
 *
 * Why metadata? We store userId and credits in session metadata so the webhook
 * can grant credits without needing to query our database during checkout.
 * Stripe guarantees metadata is included in webhook events.
 */
/**
 * Creates Stripe checkout session with functional error handling.
 */
const createCheckoutSession = async (
  priceId: string,
  userId: string,
  credits: number,
  userEmail: string | undefined,
  request: NextRequest
): Promise<Result<Stripe.Checkout.Session, Error>> => {
  // Use NEXT_PUBLIC_APP_URL only if it's a production URL (not localhost)
  // In development, use request origin to support any port/hostname
  const requestUrl = new URL(request.url);
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isProductionUrl =
    envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1");
  const isRequestLocalhost =
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname.startsWith("192.168.") ||
    requestUrl.hostname.startsWith("10.");

  const baseUrl = isRequestLocalhost
    ? requestUrl.origin
    : isProductionUrl
    ? envUrl
    : requestUrl.origin;

  try {
    // Statement descriptor appears on customer's credit card statement
    // Requirements: 5-22 characters, letters/numbers/spaces only
    // For Kleingewerbe: No VAT info needed, just business name
    const statementDescriptor = process.env.STRIPE_STATEMENT_DESCRIPTOR || 'XTRUSTRADAR';

    const stripeResult = stripe();
    if (stripeResult.isErr()) {
      return err(stripeResult.error);
    }

    const session = await stripeResult.value.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}?checkout=success`,
      cancel_url: `${baseUrl}?checkout=canceled`,
      customer_email: userEmail || undefined,
      payment_intent_data: {
        statement_descriptor: statementDescriptor,
      },
      metadata: {
        userId,
        credits: credits.toString(),
      },
    });

    if (!session.url) {
      return err(new Error('Stripe session created but no URL returned'));
    }

    return ok(session);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Failed to create Stripe checkout session'));
  }
};

export async function POST(request: NextRequest) {
  const supabaseResult = await createClient();
  if (supabaseResult.isErr()) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Server configuration error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
  const supabase = supabaseResult.value;

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Parse request body - handle JSON parsing errors functionally
  let body: unknown;
  try {
    body = await request.json();
  } catch (parseError) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Invalid JSON in request body', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  // Validate request body shape using type guard
  if (!isCreditsRequest(body)) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Credits amount is required and must be a number', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  // Find Price ID for requested credit amount
  const priceId = Array.from(CREDIT_PACKS.entries())
    .find(([, creditAmount]) => creditAmount === body.credits)?.[0];

  if (!priceId) {
    return NextResponse.json<ErrorResponse>(
      { error: 'Invalid credit pack', code: 'INVALID_CREDIT_PACK' },
      { status: 400 }
    );
  }

  // Create Stripe Checkout session - using Result type
  const sessionResult = await createCheckoutSession(priceId, user.id, body.credits, user.email || undefined, request);

  if (sessionResult.isErr()) {
    console.error('Checkout error:', sessionResult.error.message);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to create checkout session', code: 'CHECKOUT_CREATION_FAILED' },
      { status: 500 }
    );
  }

  const session = sessionResult.value;

  return NextResponse.json<{ url: string }>({ url: session.url! });
}

