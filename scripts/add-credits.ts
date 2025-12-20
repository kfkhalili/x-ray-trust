#!/usr/bin/env tsx
/**
 * Script to add credits to a user's account.
 * Usage: npx tsx scripts/add-credits.ts <email> <credits>
 * Example: npx tsx scripts/add-credits.ts user@example.com 100
 */

import { createAdminClient } from '../lib/supabase/admin';

async function addCredits(email: string, creditsToAdd: number) {
  const supabase = createAdminClient();

  // First, find the user by email
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);

  if (authError || !authUser?.user) {
    console.error('Error finding user:', authError?.message || 'User not found');
    process.exit(1);
  }

  const userId = authUser.user.id;

  // Get current credits
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error('Error fetching profile:', fetchError?.message || 'Profile not found');
    process.exit(1);
  }

  const currentCredits = profile.credits;
  const newCredits = currentCredits + creditsToAdd;

  // Update credits
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating credits:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Successfully added ${creditsToAdd} credits to ${email}`);
  console.log(`   Previous balance: ${currentCredits}`);
  console.log(`   New balance: ${newCredits}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npx tsx scripts/add-credits.ts <email> <credits>');
  console.error('Example: npx tsx scripts/add-credits.ts user@example.com 100');
  process.exit(1);
}

const email = args[0];
const credits = parseInt(args[1], 10);

if (isNaN(credits) || credits <= 0) {
  console.error('Error: Credits must be a positive number');
  process.exit(1);
}

addCredits(email, credits).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

