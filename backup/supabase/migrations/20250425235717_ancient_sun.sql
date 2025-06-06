/*
  # Add Honda ATV Models

  1. Changes
    - Add ATV segment for Honda
    - Add 2025 Honda ATV models
    - Add model codes for each variant
    
  2. Security
    - Maintain existing RLS policies
*/

-- Get Honda brand ID
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
-- Add ATV segment if it doesn't exist
INSERT INTO vehicle_segments (name, brand_id)
SELECT 'ATV', honda_brand.id
FROM honda_brand
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_segments 
  WHERE name = 'ATV' 
  AND brand_id = honda_brand.id
);

-- Add ATV models
WITH atv_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT atv_segment.id, model_name
FROM atv_segment,
UNNEST(ARRAY[
  'TRX90X',
  'TRX420 Rancher',
  'TRX520 Foreman',
  'TRX520 Rubicon IRS EPS',
  'TRX520 Rubicon DCT IRS EPS',
  'TRX520 Rubicon DCT IRS EPS Deluxe',
  'TRX700 Rubicon'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = atv_segment.id 
  AND vm.name = model_name
);

-- Add 2025 model codes
WITH atv_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    ('TRX90X', 'TRX90XS'),
    ('TRX420 Rancher', 'TRX420FM1S'),
    ('TRX520 Foreman', 'TRX520FM1S'),
    ('TRX520 Rubicon IRS EPS', 'TRX520FM6SS'),
    ('TRX520 Rubicon DCT IRS EPS', 'TRX520FA6S'),
    ('TRX520 Rubicon DCT IRS EPS', 'TRX520FA6CS'),
    ('TRX520 Rubicon DCT IRS EPS Deluxe', 'TRX520FA7SS'),
    ('TRX700 Rubicon', 'TRX700FA5S')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM atv_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025);