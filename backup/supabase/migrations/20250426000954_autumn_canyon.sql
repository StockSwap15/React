/*
  # Add Honda ATV Segment and Models

  1. Changes
    - Add ATV segment for Honda
    - Add TRX models
    - Add 2025 model codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- Get Honda brand ID and add ATV segment
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
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
  'TRX90X Sport',
  'Rancher 420 Series',
  'Foreman',
  'Rubicon IRS EPS',
  'Rubicon DCT IRS EPS',
  'Rubicon DCT IRS EPS Deluxe',
  'Rubicon 700'
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
    ('TRX90X Sport', 'TRX90XS'),
    ('Rancher 420 Series', 'TRX420FM1S'),
    ('Foreman', 'TRX520FM1S'),
    ('Rubicon IRS EPS', 'TRX520FM6SS'),
    ('Rubicon DCT IRS EPS', 'TRX520FA6S'),
    ('Rubicon DCT IRS EPS', 'TRX520FA6CS'),
    ('Rubicon DCT IRS EPS Deluxe', 'TRX520FA7SS'),
    ('Rubicon 700', 'TRX700FA5S')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM atv_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025);