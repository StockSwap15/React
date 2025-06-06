/*
  # Fix profiles table foreign key constraint

  1. Changes
    - Remove incorrect foreign key constraint to non-existent users table
    - Add correct foreign key constraint to auth.users table
  
  2. Security
    - Maintains existing RLS policies
*/

-- First remove the incorrect foreign key constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;