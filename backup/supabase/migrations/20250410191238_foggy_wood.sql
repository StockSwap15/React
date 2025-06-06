/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies that may be causing issues
    - Create new RLS policies with proper access control
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Authenticated users can read their own profile
      - Authenticated users can update their own profile
      - New users can create their profile during signup
      - Admins can read all profiles
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
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

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for profile creation during signup
CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);