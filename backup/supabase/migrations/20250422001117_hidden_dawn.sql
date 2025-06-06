/*
  # Fix Listings RLS Policies

  1. Changes
    - Update RLS policies to allow public viewing of both available and searching listings
    - Maintain existing policies for creation and updates
    
  2. Security
    - Enable RLS
    - Add proper policies for CRUD operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view available listings" ON listings;
DROP POLICY IF EXISTS "Dealers can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update listings" ON listings;
DROP POLICY IF EXISTS "Users can delete listings" ON listings;

-- Create new policies
CREATE POLICY "Public can view listings"
  ON listings FOR SELECT
  TO public
  USING (
    status IN ('available', 'searching') OR 
    (auth.uid() IS NOT NULL AND dealer_id = auth.uid())
  );

CREATE POLICY "Users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );