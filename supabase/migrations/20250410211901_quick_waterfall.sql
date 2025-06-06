/*
  # Fix Authentication Schema and RLS Policies

  1. Changes
    - Drop and recreate profiles table with proper structure
    - Set up correct RLS policies for authentication flow
    - Add admin user creation with proper auth integration
    
  2. Security
    - Enable RLS
    - Add policies for:
      - Profile creation during signup
      - Profile viewing for authenticated users
      - Profile updates for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with proper structure
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

-- Create policies with proper permissions
CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create initial admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- First create the auth user if it doesn't exist
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
    updated_at
  ) 
  SELECT
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
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'Ryan@hondapenticton.com'
  )
  RETURNING id INTO admin_user_id;

  -- If we didn't insert a new user, get the ID of the existing one
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'Ryan@hondapenticton.com';
  END IF;

  -- Now create the profile using the correct user ID
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
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      updated_at = now();
END
$$;