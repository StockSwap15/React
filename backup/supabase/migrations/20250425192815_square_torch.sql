/*
  # Add Honda brand

  1. Changes
    - Insert Honda into vehicle_brands table
    - Add initial Honda segments
    
  2. Security
    - Maintain existing RLS policies
*/

-- Insert Honda brand if it doesn't exist
INSERT INTO vehicle_brands (name)
VALUES ('Honda')
ON CONFLICT (name) DO NOTHING;

-- Add Honda segments
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
INSERT INTO vehicle_segments (name, brand_id)
VALUES 
  ('Pioneer', (SELECT id FROM honda_brand)),
  ('Talon', (SELECT id FROM honda_brand)),
  ('FourTrax', (SELECT id FROM honda_brand))
ON CONFLICT (name) DO NOTHING;