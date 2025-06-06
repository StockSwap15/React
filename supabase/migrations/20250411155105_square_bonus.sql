/*
  # Clean up duplicate users

  1. Changes
    - Remove duplicate profiles keeping most recent
    - Remove orphaned auth.users entries
    - Add additional constraint to prevent future duplicates
    
  2. Security
    - Maintain existing RLS policies
    - Preserve admin access
*/

-- First, identify and remove duplicate profiles, keeping the most recently updated one
WITH duplicates AS (
  SELECT id,
         email,
         ROW_NUMBER() OVER (
           PARTITION BY email
           ORDER BY updated_at DESC, created_at DESC
         ) as row_num
  FROM profiles
)
DELETE FROM profiles p
USING duplicates d
WHERE p.id = d.id
AND d.row_num > 1;

-- Remove any orphaned auth.users entries that don't have corresponding profiles
DELETE FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM profiles p
  WHERE p.id = u.id
);

-- Add a trigger to prevent duplicate emails across profiles
CREATE OR REPLACE FUNCTION check_duplicate_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE email = NEW.email
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address already exists';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_email();