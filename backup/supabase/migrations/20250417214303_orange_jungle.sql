/*
  # Add RZR Trail Models and Codes

  1. Changes
    - Add RZR Trail models if they don't exist
    - Add 2024 model codes for Trail variants
    - Maintain existing relationships
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add RZR Trail models if they don't exist
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT rzr_segment.id, model_name
FROM rzr_segment,
UNNEST(ARRAY[
  'RZR Trail Sport',
  'RZR Trail Ultimate',
  'RZR Trail S Sport',
  'RZR Trail S Ultimate'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = rzr_segment.id AND vm.name = model_name
);

-- Insert the 2024 RZR Trail model codes
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- RZR Trail Models
    ('RZR Trail Sport', 'Z24ASE87A5'),
    ('RZR Trail Ultimate', 'Z24ASK87A5'),
    ('RZR Trail S Sport', 'Z24ASE87A5'),
    ('RZR Trail S Ultimate', 'Z24ASK99A5')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM rzr_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);