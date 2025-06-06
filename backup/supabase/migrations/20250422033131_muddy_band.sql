/*
  # Add Listing Expiration System

  1. Changes
    - Add expires_at column to listings table
    - Add function to handle expiration updates
    - Update RLS policies to handle expiration
    - Add cleanup function for expired listings
    
  2. Security
    - Maintain existing RLS policies
    - Add constraints for expiration dates
*/

-- Add expires_at column
ALTER TABLE listings
ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '30 days');

-- Add constraint to ensure expires_at is in the future
ALTER TABLE listings
ADD CONSTRAINT listings_expires_at_check
CHECK (expires_at > created_at);

-- Create function to handle listing renewal
CREATE OR REPLACE FUNCTION renew_listing(listing_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_expiry timestamptz;
BEGIN
  -- Set new expiration date to 30 days from now
  new_expiry := now() + interval '30 days';
  
  -- Update the listing
  UPDATE listings
  SET expires_at = new_expiry,
      updated_at = now()
  WHERE id = listing_id
  AND (dealer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));
  
  RETURN new_expiry;
END;
$$;

-- Update RLS policies to consider expiration
DROP POLICY IF EXISTS "Public can view listings" ON listings;
CREATE POLICY "Public can view listings"
  ON listings FOR SELECT
  TO public
  USING (
    (status IN ('available', 'searching') AND expires_at > now()) OR 
    (auth.uid() IS NOT NULL AND dealer_id = auth.uid())
  );

-- Create function to archive expired listings
CREATE OR REPLACE FUNCTION archive_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE listings
  SET status = 'archived'
  WHERE expires_at < now()
  AND status NOT IN ('sold', 'cancelled', 'archived');
END;
$$;

-- Add status 'archived' to the status check constraint
ALTER TABLE listings DROP CONSTRAINT IF EXISTS status_check;
ALTER TABLE listings ADD CONSTRAINT status_check 
CHECK (status IN ('available', 'pending', 'sold', 'cancelled', 'searching', 'archived'));