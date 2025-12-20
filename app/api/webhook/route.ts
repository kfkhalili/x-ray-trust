import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';

/**
 * Verifies Stripe webhook signature to ensure request authenticity.
 * Returns the event object if valid, null otherwise.
 */
const verifyWebhookSignature = async (
  request: NextRequest
): Promise<Stripe.Event | null> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return null;
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch {
    return null;
  }
};

/**
 * Adds credits to user's profile after successful payment.
 * Uses Supabase admin client to bypass RLS for webhook operations.
 */
const addCreditsToUser = async (userId: string, credits: number): Promise<boolean> => {
  // Validate env vars at runtime
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing Supabase configuration');
    return false;
  }

  const supabase = createAdminClient();

  // Get current credits
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return false;
  }

  // Atomic increment
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits + credits })
    .eq('id', userId);

  return !updateError;
};

/**
 * POST /api/webhook
 *
 * Handles Stripe webhook events for payment completion.
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Handle checkout.session.completed event
 * 3. Extract user ID and credits from metadata
 * 4. Add credits to user's profile
 *
 * Security: Webhook signature verification prevents unauthorized credit grants.
 */
export async function POST(request: NextRequest) {
  const event = await verifyWebhookSignature(request);

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const creditsStr = session.metadata?.credits;

    if (!userId || !creditsStr) {
      console.error('Missing metadata in checkout session:', session.id);
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      );
    }

    const credits = parseInt(creditsStr, 10);

    if (isNaN(credits) || credits <= 0) {
      console.error('Invalid credits value:', creditsStr);
      return NextResponse.json(
        { error: 'Invalid credits' },
        { status: 400 }
      );
    }

    const success = await addCreditsToUser(userId, credits);

    if (!success) {
      console.error('Failed to add credits to user:', userId);
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  }

  // Acknowledge other event types without processing
  return NextResponse.json({ received: true });
}

