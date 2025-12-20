#!/usr/bin/env node
/**
 * Script to add credits to a user's account.
 * Usage: node scripts/add-credits.js <email> <credits>
 * Example: node scripts/add-credits.js user@example.com 100
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

const env = loadEnv();

async function addCredits(email, creditsToAdd) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // First, find the user by email using SQL query
  const { data: authUsers, error: authError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single();

  if (authError || !authUsers) {
    // Try alternative: query profiles table directly with email
    const { data: profileByEmail, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (profileError || !profileByEmail) {
      console.error('Error finding user:', authError?.message || profileError?.message || 'User not found');
      process.exit(1);
    }

    var userId = profileByEmail.id;
  } else {
    var userId = authUsers.id;
  }

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
  console.error('Usage: node scripts/add-credits.js <email> <credits>');
  console.error('Example: node scripts/add-credits.js user@example.com 100');
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
