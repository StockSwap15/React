/*
  # Rename ATV Segment to Sportsman

  1. Changes
    - Update the name of the ATV segment to Sportsman
    - Maintain all existing relationships and data
    
  2. Security
    - Maintain existing RLS policies
*/

-- Update the segment name from ATV to Sportsman
UPDATE vehicle_segments
SET name = 'Sportsman'
WHERE name = 'ATV'
AND brand_id = (
  SELECT id 
  FROM vehicle_brands 
  WHERE name = 'Polaris'
);