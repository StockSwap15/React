/*
  # Update additional Off-road model names

  1. Changes
    - Update Dual Sport and Dual Rally model names to CRF format
    - Maintain existing relationships and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update model names in the Off-road segment
UPDATE vehicle_models
SET name = 'CRF300L'
WHERE name = 'Dual Sport'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

UPDATE vehicle_models
SET name = 'CRF300L Rally'
WHERE name = 'Dual Rally'
AND segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);