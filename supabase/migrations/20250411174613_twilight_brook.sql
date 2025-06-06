/*
  # Remove coordinates and add location field

  1. Changes
    - Remove latitude and longitude columns
    - Add location field for manual entry
    
  2. Security
    - Maintain existing RLS policies
*/

-- Remove coordinates columns from profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- Drop the coordinates index
DROP INDEX IF EXISTS profiles_coordinates_idx;

-- Add location field to listings table
ALTER TABLE listings
ADD COLUMN location text;