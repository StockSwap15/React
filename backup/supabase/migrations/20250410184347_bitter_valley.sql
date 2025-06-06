/*
  # Fix authentication schema

  1. Changes
    - Remove foreign key constraint from profiles table as it's not needed
      (Supabase auth handles the user table internally)
    
  2. Security
    - RLS policies remain unchanged
    - Table remains RLS enabled
*/

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;