/*
  # Fix Authentication Schema

  1. Changes
    - Create users table for any missing profile references
    - Update foreign key constraint on profiles table safely
    - Add RLS policies for proper authentication

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users
*/

-- First, ensure we have corresponding users for all profiles
DO $$ 
BEGIN
  -- Insert missing users for existing profiles
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
    p.id,
    'authenticated',
    'authenticated',
    p.email,
    crypt('TemporaryPassword123', gen_salt('bf')), -- Temporary password that should be changed
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = p.id
  );
END $$;

-- Now we can safely add the foreign key constraint
DO $$ 
BEGIN
  -- Drop existing foreign key if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;

  -- Add foreign key constraint
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
END $$;

-- Enable RLS on users table if not already enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON auth.users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;