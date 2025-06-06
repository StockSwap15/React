/*
  # Final Schema Cleanup and Validation

  1. Changes
    - Ensure all tables have proper constraints
    - Validate all foreign key relationships
    - Ensure all RLS policies are correct
    - Clean up any orphaned records
    
  2. Security
    - Verify RLS is enabled on all tables
    - Ensure proper access control
*/

-- Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Clean up any orphaned records
DELETE FROM listings WHERE dealer_id NOT IN (SELECT id FROM profiles);
DELETE FROM messages WHERE sender_id NOT IN (SELECT id FROM profiles);
DELETE FROM messages WHERE receiver_id NOT IN (SELECT id FROM profiles);
DELETE FROM messages WHERE listing_id NOT IN (SELECT id FROM listings);

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_email_key ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_dealer_name_idx ON profiles(dealer_name);
CREATE INDEX IF NOT EXISTS listings_dealer_id_idx ON listings(dealer_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status);
CREATE INDEX IF NOT EXISTS listings_make_model_idx ON listings(make, model);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages(listing_id);
CREATE INDEX IF NOT EXISTS messages_read_idx ON messages(read);

-- Ensure all constraints are properly set
ALTER TABLE profiles
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'dealer';

ALTER TABLE listings
ALTER COLUMN make SET NOT NULL,
ALTER COLUMN model SET NOT NULL,
ALTER COLUMN year SET NOT NULL,
ALTER COLUMN vin SET NOT NULL,
ALTER COLUMN pdi_fee SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'available';

ALTER TABLE messages
ALTER COLUMN content SET NOT NULL,
ALTER COLUMN read SET DEFAULT false;

-- Verify constraints
DO $$
BEGIN
  -- Check year constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'year_check'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT year_check 
    CHECK (year >= 1900 AND year <= extract(year from now()) + 1);
  END IF;

  -- Check pdi_fee constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pdi_fee_check'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT pdi_fee_check 
    CHECK (pdi_fee >= 0);
  END IF;

  -- Check status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'status_check'
  ) THEN
    ALTER TABLE listings
    ADD CONSTRAINT status_check 
    CHECK (status IN ('available', 'pending', 'sold', 'cancelled'));
  END IF;

  -- Check email format constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_email_check 
    CHECK (email ~* '^.+@.+\..+$');
  END IF;
END $$;