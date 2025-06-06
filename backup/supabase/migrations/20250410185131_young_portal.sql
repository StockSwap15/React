/*
  # Initialize Profiles Schema

  1. Table Structure
    - Creates the profiles table with proper auth integration
    - Adds email validation
    - Sets up timestamps
    - Configures role management

  2. Security
    - Enables Row Level Security (RLS)
    - Sets up policies for:
      - Public read access
      - User-specific insert
      - User-specific update
    
  3. Triggers
    - Adds updated_at timestamp handling
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

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Handle updated_at
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

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'Ryan@hondapenticton.com';

  -- If admin doesn't exist, create them
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      email_confirmed_at,
      encrypted_password,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      'Ryan@hondapenticton.com',
      '{"provider":"email"}',
      '{"provider":"email","providers":["email"]}',
      now(),
      now(),
      now(),
      crypt('Admin1500', gen_salt('bf')),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO admin_user_id;

    -- Create admin profile
    INSERT INTO public.profiles (
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
  END IF;
END
$$;