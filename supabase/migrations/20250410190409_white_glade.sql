/*
  # Fix profiles table RLS policies

  1. Changes
    - Update RLS policies for the profiles table to ensure proper authentication flow
    - Add policy for unauthenticated users to allow profile creation during sign-up
    - Modify existing policies to use proper auth functions

  2. Security
    - Enable RLS (already enabled)
    - Update policies to use proper auth functions
    - Ensure proper access control for profile operations
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Allow selecting own profile for authenticated users
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow inserting profile during sign up (needed for auth flow)
CREATE POLICY "Users can insert their own profile during signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow updating own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);