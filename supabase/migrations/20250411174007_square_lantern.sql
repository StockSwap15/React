/*
  # Add Geolocation Support

  1. Changes
    - Add latitude and longitude columns to profiles table
    - Add indexes for spatial queries
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add coordinates columns to profiles table
ALTER TABLE profiles
ADD COLUMN latitude numeric(10,6),
ADD COLUMN longitude numeric(10,6);

-- Create index for spatial queries
CREATE INDEX profiles_coordinates_idx ON profiles(latitude, longitude);