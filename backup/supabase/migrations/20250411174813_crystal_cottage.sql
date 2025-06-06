/*
  # Fix listings RLS policies

  1. Changes
    - Update RLS policies for listings table
    - Add policy for deletion
    - Fix visibility of deleted listings
    
  2. Security
    - Enable RLS
    - Add proper policies for CRUD operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Dealers can create listings" ON listings;
DROP POLICY IF EXISTS "Everyone can view available listings" ON listings;
DROP POLICY IF EXISTS "Dealers can update own listings" ON listings;

-- Create new policies
CREATE POLICY "Dealers can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Everyone can view available listings"
  ON listings FOR SELECT
  TO public
  USING (
    status = 'available' OR 
    (auth.uid() IS NOT NULL AND dealer_id = auth.uid())
  );

CREATE POLICY "Dealers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Dealers can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (dealer_id = auth.uid());