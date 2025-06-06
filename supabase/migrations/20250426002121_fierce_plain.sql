/*
  # Add 2024 Honda SXS Models

  1. Changes
    - Add 2024 model codes for Honda SXS segment
    - Update model names to match 2024 lineup
    - Ensure proper relationships between models and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add any missing models to the SXS segment
WITH sxs_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'SXS'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT sxs_segment.id, model_name
FROM sxs_segment,
UNNEST(ARRAY[
  'Pioneer 520',
  'Pioneer 700 - 4P Deluxe',
  'Pioneer 700 - 2P Deluxe',
  'Pioneer 1000 - 3P EPS',
  'Pioneer 1000 - 5P Deluxe',
  'Pioneer 1000 - 5P Trail',
  'Pioneer 1000 - 5P Forest',
  'Talon 2 Seater'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = sxs_segment.id 
  AND vm.name = model_name
);

-- Add 2024 model codes
WITH sxs_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'SXS'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    ('Pioneer 520', 'SXS5M2R'),
    ('Pioneer 700 - 4P Deluxe', 'SXS7M4DR'),
    ('Pioneer 700 - 2P Deluxe', 'SXS7M2DR'),
    ('Pioneer 1000 - 3P EPS', 'SXS10M3PR'),
    ('Pioneer 1000 - 5P Deluxe', 'SXS10M5DR'),
    ('Pioneer 1000 - 5P Trail', 'SXS10M5LR'),
    ('Pioneer 1000 - 5P Forest', 'SXS10M5LCR'),
    ('Talon 2 Seater', 'SXS10S2XR')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM sxs_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);