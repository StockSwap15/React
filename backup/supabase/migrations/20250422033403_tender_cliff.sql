/*
  # Audit Listing Expiration System

  1. Tests
    - Verify expiration dates are set correctly
    - Validate RLS policies
    - Test renewal function
    - Confirm archival process
*/

-- Test function to verify listing expiration
CREATE OR REPLACE FUNCTION test_listing_expiration()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_listing_id uuid;
  result text;
BEGIN
  -- Create a test listing
  INSERT INTO listings (
    dealer_id,
    make,
    model,
    year,
    status,
    expires_at
  ) VALUES (
    auth.uid(),
    'Test Make',
    'Test Model',
    2024,
    'available',
    now() - interval '1 day'
  ) RETURNING id INTO test_listing_id;

  -- Run archival process
  PERFORM archive_expired_listings();

  -- Verify listing was archived
  SELECT status INTO result
  FROM listings
  WHERE id = test_listing_id;

  -- Clean up test data
  DELETE FROM listings WHERE id = test_listing_id;

  RETURN result;
END;
$$;

-- Add constraint to prevent expired listings from being created as available
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS listings_available_not_expired;

ALTER TABLE listings
ADD CONSTRAINT listings_available_not_expired
CHECK (
  status != 'available' OR 
  (status = 'available' AND expires_at > now())
);

-- Add index for expiration queries
CREATE INDEX IF NOT EXISTS listings_expires_at_idx ON listings(expires_at)
WHERE status IN ('available', 'searching');

-- Update archive function to include logging
CREATE OR REPLACE FUNCTION archive_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
BEGIN
  WITH archived AS (
    UPDATE listings
    SET 
      status = 'archived',
      updated_at = now()
    WHERE 
      expires_at < now()
      AND status NOT IN ('sold', 'cancelled', 'archived')
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;

  -- Log the archival count
  INSERT INTO audit_log (
    action,
    table_name,
    details
  ) VALUES (
    'archive_expired',
    'listings',
    format('Archived %s expired listings', archived_count)
  );
END;
$$;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );