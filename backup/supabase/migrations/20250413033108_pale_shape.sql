/*
  # Add Admin Listing Management Policies

  1. Changes
    - Add policy for admin listing management
    - Allow admins to delete any listing
    - Allow admins to update any listing
    
  2. Security
    - Maintain existing RLS policies
    - Add admin-specific policies
*/

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Dealers can delete own listings" ON listings;

-- Create new delete policy that includes admin access
CREATE POLICY "Users can delete listings"
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

-- Update the update policy to allow admin access
DROP POLICY IF EXISTS "Dealers can update own listings" ON listings;

CREATE POLICY "Users can update listings"
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