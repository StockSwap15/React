/*
  # Fix profiles table schema

  1. Changes
    - Drop the incorrect foreign key constraint that references non-existent users table
    - Ensure profiles table has correct structure and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop the foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;