/*
  # Delete Pioneer, Talon and FourTrax segments

  1. Changes
    - Delete all existing Honda segments and models
    - Start fresh with correct segment structure
    
  2. Security
    - Maintain existing RLS policies
*/

-- First delete all Honda segments to start fresh
DELETE FROM vehicle_segments
WHERE brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda');

-- Recreate only the On-Road and Off-road segments
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
INSERT INTO vehicle_segments (name, brand_id)
SELECT name, honda_brand.id
FROM honda_brand,
UNNEST(ARRAY['On-Road', 'Off-road']) AS name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_segments 
  WHERE vehicle_segments.name = name
  AND brand_id = honda_brand.id
);