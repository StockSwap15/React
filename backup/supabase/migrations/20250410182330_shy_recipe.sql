/*
  # Fix Authentication Schema

  1. Changes
    - Drop existing foreign key constraint from profiles table
    - Add missing auth schema reference
    - Update profiles table to use auth.users reference
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper connection between auth.users and profiles
*/

-- First remove the existing foreign key that's pointing to a non-existent table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the correct foreign key constraint to auth.users
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id)
ON DELETE CASCADE;