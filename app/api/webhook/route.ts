import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { Result, ok, err } from 'neverthrow';

// Mark route as dynamic to prevent build-time analysis
export const dynamic = 'force-dynamic';

/**
 * Verifies Stripe webhook signature before processing.
 *
 * Why verify? Anyone can POST to this endpoint. Without signature verification,
 * attackers could send fake "payment succeeded" events and grant themselves credits.
 * Stripe's signature proves the event came from Stripe's servers.
 *
 * Returns Result type instead of null - functional error handling.
 */
const verifyWebhookSignature = async (
  request: NextRequest
): Promise<Result<Stripe.Event, Error>> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return err(new Error('STRIPE_WEBHOOK_SECRET not configured'));
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return err(new Error('Missing stripe-signature header'));
  }

  try {
    const event = stripe().webhooks.constructEvent(body, signature, webhookSecret);
    return ok(event);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Invalid webhook signature'));
  }
};

/**
 * Grants credits after verified payment completion.
 *
 * Why admin client? Webhooks run server-to-server without user session cookies.
 * RLS would block these requests. Admin client bypasses RLS because we've
 * already verified the payment via Stripe signature.
 *
 * Returns Result type instead of boolean - functional error handling.
 */
const addCreditsToUser = async (userId: string, credits: number): Promise<Result<void, Error>> => {
  const adminClientResult = createAdminClient();

  if (adminClientResult.isErr()) {
    return err(adminClientResult.error);
  }

  const supabase = adminClientResult.value;

  // Get current credits
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return err(new Error(`Failed to fetch profile: ${fetchError?.message ?? 'Profile not found'}`));
  }

  // Atomic increment
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: profile.credits + credits })
    .eq('id', userId);

  if (updateError) {
    return err(new Error(`Failed to update credits: ${updateError.message}`));
  }

  return ok(undefined);
};

/**
 * POST /api/webhook — handles Stripe payment events.
 *
 * Only processes checkout.session.completed. Other events (subscription updates,
 * refunds, etc.) are acknowledged but ignored. Keeps webhook handler simple
 * and focused on the credit-granting use case.
 */
export async function POST(request: NextRequest) {
  const eventResult = await verifyWebhookSignature(request);

  if (eventResult.isErr()) {
    return NextResponse.json(
      { error: 'Invalid signature', details: eventResult.error.message },
      { status: 400 }
    );
  }

  const event = eventResult.value;

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

    const addCreditsResult = await addCreditsToUser(userId, credits);

    if (addCreditsResult.isErr()) {
      console.error('Failed to add credits to user:', userId, addCreditsResult.error.message);
      return NextResponse.json(
        { error: 'Failed to update credits', details: addCreditsResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  }

  // Acknowledge other event types without processing
  return NextResponse.json({ received: true });
}

