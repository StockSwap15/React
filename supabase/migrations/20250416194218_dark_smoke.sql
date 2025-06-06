/*
  # Add Brands Schema and Relationships

  1. New Tables
    - `vehicle_brands`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add brand_id to vehicle_segments table
    - Update existing data to link with Polaris brand
    
  3. Security
    - Enable RLS
    - Add policies for public reading
*/

-- Create brands table
CREATE TABLE vehicle_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vehicle_brands ENABLE ROW LEVEL SECURITY;

-- Create policy for public reading
CREATE POLICY "Allow public reading of vehicle brands"
  ON vehicle_brands FOR SELECT
  TO public
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER handle_vehicle_brands_updated_at
  BEFORE UPDATE ON vehicle_brands
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add brand_id to segments table
ALTER TABLE vehicle_segments
ADD COLUMN brand_id uuid REFERENCES vehicle_brands(id) ON DELETE CASCADE;

-- Insert Polaris brand
INSERT INTO vehicle_brands (name) VALUES ('Polaris');

-- Update existing segments to link with Polaris
UPDATE vehicle_segments
SET brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Polaris');

-- Make brand_id required for future entries
ALTER TABLE vehicle_segments
ALTER COLUMN brand_id SET NOT NULL;

-- Create index for brand_id
CREATE INDEX vehicle_segments_brand_id_idx ON vehicle_segments(brand_id);