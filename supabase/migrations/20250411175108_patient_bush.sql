/*
  # Remove financing_type from listings table

  1. Changes
    - Remove financing_type column from listings table
    - Remove financing_type constraint
    - Update RLS policies
    
  2. Security
    - Maintain existing RLS policies
*/

-- Remove financing_type constraint
ALTER TABLE listings
DROP CONSTRAINT IF EXISTS financing_type_check;

-- Remove financing_type column
ALTER TABLE listings
DROP COLUMN IF EXISTS financing_type;