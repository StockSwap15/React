/*
  # Add Additional Profile Fields

  1. Changes
    - Add new columns to profiles table for enhanced dealer information
    - Add indexes for new searchable fields
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS alternate_phone text,
ADD COLUMN IF NOT EXISTS fax text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS business_hours text,
ADD COLUMN IF NOT EXISTS dealer_logo_url text;

-- Create indexes for searchable fields
CREATE INDEX IF NOT EXISTS profiles_website_idx ON profiles(website);
CREATE INDEX IF NOT EXISTS profiles_dealer_logo_url_idx ON profiles(dealer_logo_url);