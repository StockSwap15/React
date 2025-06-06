/*
  # Clean Database Schema Setup

  1. Changes
    - Drop and recreate profiles table with proper structure
    - Set up correct indexes and constraints
    - Configure RLS policies
    - Add triggers for automatic updates
    
  2. Security
    - Enable RLS
    - Set explicit search paths for functions
    - Add proper constraints and checks
*/

-- Drop existing objects to ensure clean slate
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
DROP TRIGGER IF EXISTS prevent_duplicate_email ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS check_duplicate_email();
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'dealer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_email_check CHECK (email ~* '^.+@.+\..+$')
);

-- Create indexes (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'profiles_id_idx'
  ) THEN
    CREATE INDEX profiles_id_idx ON profiles(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'profiles_email_key'
  ) THEN
    CREATE UNIQUE INDEX profiles_email_key ON profiles(email);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public profile reading" ON profiles;
  DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
  
  CREATE POLICY "Allow public profile reading"
    ON profiles FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Enable profile creation during signup"
    ON profiles FOR INSERT
    TO public
    WITH CHECK (true);

  CREATE POLICY "Enable update for users based on id"
    ON profiles FOR UPDATE
    TO public
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
END $$;

-- Create handle_updated_at function and trigger
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

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create check_duplicate_email function and trigger
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

-- Create handle_new_user function and trigger
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Clean up any duplicate profiles, keeping the most recently updated one
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

-- Remove any orphaned auth.users entries
DELETE FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM profiles p
  WHERE p.id = u.id
);