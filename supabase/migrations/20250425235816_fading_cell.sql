/*
  # Add Honda SXS Models

  1. Changes
    - Add SXS segment for Honda
    - Add 2025 Honda Pioneer and Talon models
    - Add model codes for each variant
    
  2. Security
    - Maintain existing RLS policies
*/

-- Get Honda brand ID
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
-- Add SXS segment if it doesn't exist
INSERT INTO vehicle_segments (name, brand_id)
SELECT 'SXS', honda_brand.id
FROM honda_brand
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_segments 
  WHERE name = 'SXS' 
  AND brand_id = honda_brand.id
);

-- Add SXS models
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
  'Pioneer 700 - 2P Deluxe',
  'Pioneer 700 - 4P Deluxe',
  'Pioneer 1000 - 3P EPS',
  'Pioneer 1000 - 5P Deluxe',
  'Pioneer 1000 - 5P Trail',
  'Pioneer 1000 - 5P Trail Special Edition',
  'Talon 2 Seater'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = sxs_segment.id 
  AND vm.name = model_name
);

-- Add 2025 model codes
WITH sxs_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'SXS'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    ('Pioneer 520', 'SXS5M2S'),
    ('Pioneer 520', 'SXS5M2CS'),
    ('Pioneer 700 - 2P Deluxe', 'SXS7M2DS'),
    ('Pioneer 700 - 4P Deluxe', 'SXS7M4DS'),
    ('Pioneer 1000 - 3P EPS', 'SXS10M3PS'),
    ('Pioneer 1000 - 5P Deluxe', 'SXS10M5DS'),
    ('Pioneer 1000 - 5P Trail', 'SXS10M5LS'),
    ('Pioneer 1000 - 5P Trail Special Edition', 'SXS10M5SS'),
    ('Talon 2 Seater', 'SXS10S2XS')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM sxs_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025);