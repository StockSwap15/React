/*
  # Add Brand-Based Access Control

  1. Changes
    - Add brands array column to profiles
    - Update RLS policies for brand-based filtering
    - Add function to validate brand access
    
  2. Security
    - Enforce brand-level access control
    - Maintain existing RLS policies
*/

-- Add brands array column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS brands text[] DEFAULT '{}';

-- Create function to check if user has access to a brand
CREATE OR REPLACE FUNCTION has_brand_access(brand_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin' OR
        brand_name = ANY(brands)
      )
    )
  );
END;
$$;

-- Update listings RLS policies to include brand checks
DROP POLICY IF EXISTS "Public can view listings" ON listings;
DROP POLICY IF EXISTS "Users can create listings" ON listings;
DROP POLICY IF EXISTS "Users can update own listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;

CREATE POLICY "Public can view listings"
  ON listings FOR SELECT
  TO public
  USING (
    (status IN ('available', 'searching') AND expires_at > now()) OR 
    (auth.uid() IS NOT NULL AND dealer_id = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin' OR
        make = ANY(brands)
      )
    ))
  );

CREATE POLICY "Users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = dealer_id AND
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (
          role = 'admin' OR
          make = ANY(brands)
        )
      )
    )
  );

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (
    (dealer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin' OR
        make = ANY(brands)
      )
    )
  )
  WITH CHECK (
    (dealer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin' OR
        make = ANY(brands)
      )
    )
  );

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (
    (dealer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (
        role = 'admin' OR
        make = ANY(brands)
      )
    )
  );