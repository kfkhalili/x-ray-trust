import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, CREDIT_PACKS } from '@/lib/stripe';

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
 * POST /api/checkout
 *
 * Creates a Stripe Checkout session for purchasing credit packs.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate credit pack selection
 * 3. Create Stripe Checkout session with metadata
 * 4. Return checkout URL
 *
 * Request body: { credits: number }
 * Response: { url: string } (Stripe Checkout URL)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as { credits?: number };

    if (!body.credits || typeof body.credits !== 'number') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Credits amount is required', code: 'INVALID_INPUT' },
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

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
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
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        credits: body.credits.toString(),
      },
    });

    if (!session.url) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to create checkout session', code: 'CHECKOUT_CREATION_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json<{ url: string }>({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

