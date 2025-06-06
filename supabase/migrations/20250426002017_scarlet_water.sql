/*
  # Add 2024 Honda ATV Models

  1. Changes
    - Add 2024 model codes for Honda ATV segment
    - Update model names to match 2024 lineup
    - Ensure proper relationships between models and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add any missing models to the ATV segment
WITH atv_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT atv_segment.id, model_name
FROM atv_segment,
UNNEST(ARRAY[
  'TRX90',
  'Rancher',
  'Foreman',
  'Foreman ES EPS',
  'Rubicon IRS EPS',
  'Rubicon DCT IRS EPS',
  'Rubicon DCT IRS EPS Deluxe',
  'Rubicon'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = atv_segment.id 
  AND vm.name = model_name
);

-- Add 2024 model codes
WITH atv_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    ('TRX90', 'TRX90XR'),
    ('Rancher', 'TRX420FM1R'),
    ('Rancher', 'TRX420FM1JR'),
    ('Foreman', 'TRX520FM1R'),
    ('Foreman', 'TRX520FM1JR'),
    ('Foreman ES EPS', 'TRX520FE2R'),
    ('Foreman ES EPS', 'TRX520FE2JR'),
    ('Rubicon IRS EPS', 'TRX520FM6SR'),
    ('Rubicon IRS EPS', 'TRX520FM6JR'),
    ('Rubicon DCT IRS EPS', 'TRX520FA6SR'),
    ('Rubicon DCT IRS EPS', 'TRX520FA6JR'),
    ('Rubicon DCT IRS EPS Deluxe', 'TRX520FA7SR'),
    ('Rubicon DCT IRS EPS Deluxe', 'TRX520FA7JR'),
    ('Rubicon', 'TRX700FA5JR')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM atv_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);