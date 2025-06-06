/*
  # Update profiles table for pending approval flow

  1. Changes
    - Set default role to 'pending' instead of 'dealer'
    - Add check constraint for valid roles
    - Update existing profiles to have valid roles
    
  2. Security
    - Maintain existing RLS policies
*/

-- First update the default value for role
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'pending';

-- Add check constraint for valid roles
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('pending', 'dealer', 'admin'));

-- Update any existing profiles with invalid roles
UPDATE profiles
SET role = 'dealer'
WHERE role NOT IN ('pending', 'dealer', 'admin');