/*
  # Update Off-road model names

  1. Changes
    - Update Trail model names to CRF format
    - Maintain existing relationships and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update model names in the Off-road segment
UPDATE vehicle_models
SET name = 'CRF110'
WHERE name = 'Trail 110'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

UPDATE vehicle_models
SET name = 'CRF125'
WHERE name = 'Trail 125'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

UPDATE vehicle_models
SET name = 'CRF125 Big Wheel'
WHERE name = 'Trail 125 Big Wheel'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

UPDATE vehicle_models
SET name = 'CRF250'
WHERE name = 'Trail 250'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

UPDATE vehicle_models
SET name = 'CRF50'
WHERE name = 'Trail 50'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);