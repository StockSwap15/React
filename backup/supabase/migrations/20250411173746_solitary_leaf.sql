/*
  # Add dealer information to profiles table

  1. Changes
    - Add dealer_name column (required)
    - Add phone column (optional)
    - Add address column (optional)
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN dealer_name text,
ADD COLUMN phone text,
ADD COLUMN address text;

-- Create index for dealer_name
CREATE INDEX profiles_dealer_name_idx ON profiles(dealer_name);