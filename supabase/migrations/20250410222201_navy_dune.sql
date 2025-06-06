/*
  # Fix RLS policy performance

  1. Changes
    - Drop existing policies
    - Recreate policies with optimized auth function calls
    - Maintain same security model but improve query performance
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Allow public profile reading" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Recreate policies with optimized auth function calls
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