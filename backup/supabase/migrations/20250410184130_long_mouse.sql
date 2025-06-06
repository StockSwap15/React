/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing policies that may conflict
    - Create new policies that properly handle authentication flow
    
  2. Security
    - Enable RLS (already enabled)
    - Add policies for:
      - Select: Allow users to view their own profile
      - Insert: Allow authenticated users to insert their own profile during signup
      - Update: Allow users to update their own profile
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);