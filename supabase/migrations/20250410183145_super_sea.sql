/*
  # Fix Authentication Schema

  1. Changes
    - Drop the foreign key constraint from profiles table that references non-existent users table
    - Update profiles table to be self-contained
    
  2. Security
    - Maintain existing RLS policies
    - Keep table secure with proper constraints
*/

-- First remove the foreign key constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure the profiles table has the correct constraints
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'dealer',
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure we have the correct indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;