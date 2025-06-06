/*
  # Fix Database Schema and Functions

  1. Changes
    - Drop and recreate profiles table with proper structure
    - Set up correct foreign key relationship with auth.users
    - Update all functions with proper search paths
    - Ensure all triggers are properly configured

  2. Security
    - Enable RLS
    - Set explicit search paths for all functions
    - Add proper constraints and checks
*/

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
DROP TRIGGER IF EXISTS prevent_duplicate_email ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS check_duplicate_email();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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