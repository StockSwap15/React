/*
  # Fix Profiles RLS Policies

  1. Changes
    - Drop existing policies
    - Add proper policies for profile management
    - Ensure proper access for profile creation and updates
    
  2. Security
    - Enable RLS
    - Add policies for authenticated and public access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public profile reading" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public reading of profiles
CREATE POLICY "Allow public reading of profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
  ON profiles FOR UPDATE
  TO public
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Verify trigger for new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();