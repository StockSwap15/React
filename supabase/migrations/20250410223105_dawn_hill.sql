/*
  # Fix Database Schema and Auth Integration

  1. Changes
    - Drop and recreate profiles table with proper structure
    - Set up correct foreign key relationship with auth.users
    - Update RLS policies with optimized queries
    - Add proper indexes and constraints

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Set proper search path for functions
*/

-- Drop existing table and recreate with proper structure
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

-- Create policies with optimized auth function calls
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
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Create updated_at trigger with explicit search path
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

-- Create initial admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth.users WHERE email = 'Ryan@hondapenticton.com';
  DELETE FROM profiles WHERE email = 'Ryan@hondapenticton.com';

  -- Create new admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'Ryan@hondapenticton.com',
    crypt('Admin1500', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    now()
  )
  RETURNING id INTO admin_user_id;

  -- Create admin profile
  INSERT INTO profiles (
    id,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Ryan@hondapenticton.com',
    'admin',
    now(),
    now()
  );
END
$$;