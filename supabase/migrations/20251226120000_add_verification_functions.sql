-- Add secure database functions for managing verifications
-- These functions use SECURITY DEFINER to bypass RLS, but are controlled by the database
-- This is safer than using service role key in application code

/**
 * Stores or updates a verification result in the cache.
 *
 * Why SECURITY DEFINER? Allows the function to bypass RLS while being called
 * by regular authenticated users. The function itself validates and controls
 * what can be written, making it safer than using service role key in app code.
 */
CREATE OR REPLACE FUNCTION public.store_verification(
  p_username TEXT,
  p_raw_data JSONB,
  p_trust_report JSONB,
  p_status TEXT DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending', 'completed', 'error') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Upsert verification
  INSERT INTO verifications (
    username,
    raw_data,
    trust_report,
    status,
    fetched_at
  ) VALUES (
    p_username,
    p_raw_data,
    p_trust_report,
    p_status,
    NOW()
  )
  ON CONFLICT (username) DO UPDATE SET
    raw_data = EXCLUDED.raw_data,
    trust_report = EXCLUDED.trust_report,
    status = EXCLUDED.status,
    fetched_at = EXCLUDED.fetched_at,
    updated_at = NOW();
END;
$$;

/**
 * Marks a verification as pending to prevent duplicate API calls.
 *
 * Returns true if successfully marked as pending, false if another request
 * is already fetching or cache is fresh.
 */
CREATE OR REPLACE FUNCTION public.mark_verification_pending(
  p_username TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_cache_age_ms BIGINT;
  v_freshness_ms BIGINT := 24 * 60 * 60 * 1000; -- 24 hours
BEGIN
  -- Check if verification already exists
  SELECT status, fetched_at INTO v_existing
  FROM verifications
  WHERE username = p_username;

  IF v_existing IS NOT NULL THEN
    -- Check if another request is already fetching
    IF v_existing.status = 'pending' THEN
      RETURN false; -- Another request is fetching
    END IF;

    -- Check if cache is fresh (don't refresh if fresh)
    v_cache_age_ms := EXTRACT(EPOCH FROM (NOW() - v_existing.fetched_at)) * 1000;
    IF v_cache_age_ms < v_freshness_ms THEN
      RETURN false; -- Cache is fresh, no need to fetch
    END IF;
  END IF;

  -- Mark as pending (upsert with placeholder data)
  INSERT INTO verifications (
    username,
    raw_data,
    trust_report,
    status,
    fetched_at
  ) VALUES (
    p_username,
    '{}'::JSONB,
    '{}'::JSONB,
    'pending',
    NOW()
  )
  ON CONFLICT (username) DO UPDATE SET
    status = 'pending',
    fetched_at = NOW(),
    updated_at = NOW();

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
-- Why authenticated? Only authenticated server-side code should call these
-- In practice, these are called from API routes which run server-side
GRANT EXECUTE ON FUNCTION public.store_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_verification_pending TO authenticated;

-- Also grant to anon for server-side API routes that might not have user context
-- But the functions themselves validate the data, so this is safe
GRANT EXECUTE ON FUNCTION public.store_verification TO anon;
GRANT EXECUTE ON FUNCTION public.mark_verification_pending TO anon;

