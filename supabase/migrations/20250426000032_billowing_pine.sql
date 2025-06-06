/*
  # Remove Honda FourTrax, Pioneer, and Talon segments

  1. Changes
    - Delete Pioneer and Talon models from SXS segment
    - Delete FourTrax models from ATV segment
    - Maintain other Honda segments and models
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper cascading deletes
*/

-- Delete Pioneer and Talon models from SXS segment
DELETE FROM vehicle_models
WHERE segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'SXS'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

-- Delete SXS segment
DELETE FROM vehicle_segments
WHERE name = 'SXS'
AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda');

-- Delete FourTrax models from ATV segment
DELETE FROM vehicle_models
WHERE segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);

-- Delete ATV segment
DELETE FROM vehicle_segments
WHERE name = 'ATV'
AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda');