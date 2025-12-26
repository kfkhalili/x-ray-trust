-- Create verifications table to cache Twitter account data and trust reports
-- This enables on-demand API calling with freshness checks and Realtime updates

CREATE TABLE IF NOT EXISTS verifications (
  username TEXT PRIMARY KEY, -- Normalized lowercase username (no @)
  raw_data JSONB NOT NULL, -- XRawData from twitterapi.io
  trust_report JSONB NOT NULL, -- Computed TrustReport
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'error')), -- Tracks fetch state for race condition handling
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When data was fetched from API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast lookups by username (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_verifications_username ON verifications(username);

-- Index for freshness checks (queries by fetched_at)
CREATE INDEX IF NOT EXISTS idx_verifications_fetched_at ON verifications(fetched_at);

-- Index for status queries (used in race condition handling)
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);

-- Enable Row Level Security
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read verification results (public data)
-- Why public? Verification results are shareable and don't contain sensitive user data
CREATE POLICY "Anyone can view verifications"
  ON verifications
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update (via admin client in API routes)
-- Why service role only? Prevents users from manipulating cached data
-- API routes use admin client to bypass RLS for writes
CREATE POLICY "Service role can manage verifications"
  ON verifications
  FOR ALL
  USING (false) -- RLS blocks all, admin client bypasses RLS
  WITH CHECK (false);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_verifications_updated_at
  BEFORE UPDATE ON verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verifications_updated_at();

-- Enable Realtime for verifications table
-- This allows clients to subscribe to updates when API data loads
-- Note: Realtime is enabled by default in Supabase, but we explicitly add the table
-- If publication doesn't exist, this will be handled by Supabase automatically
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE verifications;
  END IF;
END $$;

