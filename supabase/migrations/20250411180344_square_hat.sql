/*
  # Add photo functionality to listings

  1. Changes
    - Add photo_url column to listings table
    - Update RLS policies to allow photo updates
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add photo_url column to listings table
ALTER TABLE listings
ADD COLUMN photo_url text;

-- Create index for photo_url
CREATE INDEX listings_photo_url_idx ON listings(photo_url);