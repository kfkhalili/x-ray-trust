#!/bin/bash
# Script to add credits to a user's account using Supabase CLI
# Usage: ./scripts/add-credits.sh <email> <credits>
# Example: ./scripts/add-credits.sh user@example.com 100

if [ $# -lt 2 ]; then
  echo "Usage: $0 <email> <credits>"
  echo "Example: $0 user@example.com 100"
  exit 1
fi

EMAIL=$1
CREDITS=$2

# Validate credits is a positive number
if ! [[ "$CREDITS" =~ ^[0-9]+$ ]] || [ "$CREDITS" -le 0 ]; then
  echo "Error: Credits must be a positive number"
  exit 1
fi

# Use Supabase CLI to run SQL
supabase db execute "
UPDATE profiles
SET credits = credits + $CREDITS
WHERE id IN (
  SELECT id FROM auth.users WHERE email = '$EMAIL'
);
SELECT email, credits
FROM profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email = '$EMAIL'
);
" --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

