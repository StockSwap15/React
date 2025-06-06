/*
  # Fix search path for handle_new_user function

  1. Changes
    - Drop existing function and trigger
    - Recreate function with explicit search path
    - Recreate trigger with updated function
    
  2. Security
    - Set explicit search path to public
    - Add SECURITY DEFINER
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with explicit search path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'dealer')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();