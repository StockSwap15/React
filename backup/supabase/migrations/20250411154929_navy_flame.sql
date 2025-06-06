/*
  # Fix function search path security issue

  1. Changes
    - Drop existing handle_updated_at function
    - Recreate function with explicit search path
    - Recreate trigger to use updated function
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
DROP FUNCTION IF EXISTS handle_updated_at();

-- Recreate function with explicit search path
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();