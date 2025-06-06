/*
  # Fix profiles table policies

  1. Changes
    - Drop existing foreign key constraint
    - Re-create profiles table with proper constraints
    - Safely recreate policies by checking existence first

  2. Security
    - Enable RLS
    - Add policies for profile access
*/

-- First, drop the problematic foreign key constraint
ALTER TABLE IF EXISTS profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Re-create the profiles table with proper constraints
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'dealer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
  
  -- Create new policies
  CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Admin can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;