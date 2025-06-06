/*
  # Fix Admin User Edit Functionality

  1. Changes
    - Update RLS policies for admin profile management
    - Add policy for admin to update any profile
    - Ensure proper cascading updates
    
  2. Security
    - Maintain existing RLS policies
    - Add admin-specific policies
*/

-- Drop existing update policy
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new update policy that includes admin access
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to update listings location when profile address changes
CREATE OR REPLACE FUNCTION update_listings_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.address IS DISTINCT FROM OLD.address THEN
    UPDATE listings
    SET location = NEW.address
    WHERE dealer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to update listings location
DROP TRIGGER IF EXISTS update_listings_location_trigger ON profiles;
CREATE TRIGGER update_listings_location_trigger
  AFTER UPDATE OF address ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_listings_location();