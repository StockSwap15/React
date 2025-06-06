/*
  # Fix Database Schema Issues

  1. Changes
    - Recreate profiles table with proper structure
    - Add foreign key constraint to auth.users
    - Update RLS policies for proper authentication flow
    - Add necessary indexes and constraints

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Profile creation during signup
      - Profile viewing for authenticated users
      - Profile updates for authenticated users
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

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON profiles(email);

-- Create policies with proper permissions
CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
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