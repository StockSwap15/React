/*
  # Fix Authorization Schema

  1. Changes
    - Create profiles table if it doesn't exist
    - Update RLS policies to be more permissive
    - Enable public access for registration
    
  2. Security
    - Enable RLS
    - Configure proper access control
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'dealer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_email_check CHECK (email ~* '^.+@.+\..+$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles(email);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow public profile reading" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles
CREATE POLICY "Allow public profile reading"
ON profiles FOR SELECT
TO public
USING (true);

-- Allow profile creation during signup
CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on email"
ON profiles FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create or replace updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();