/*
  # Add Honda Off-road/Dual Sport Models

  1. Changes
    - Add Off-road/Dual Sport segment for Honda
    - Add 2025 Honda Off-road models
    - Add model codes for each variant
    
  2. Security
    - Maintain existing RLS policies
*/

-- Get Honda brand ID
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
-- Add Off-road segment if it doesn't exist
INSERT INTO vehicle_segments (name, brand_id)
SELECT 'Off-road', honda_brand.id
FROM honda_brand
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_segments 
  WHERE name = 'Off-road' 
  AND brand_id = honda_brand.id
);

-- Add Off-road models
WITH offroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT offroad_segment.id, model_name
FROM offroad_segment,
UNNEST(ARRAY[
  'Dual Sport',
  'Dual Rally',
  'NX500',
  'Africa Twin',
  'Africa Twin Adventure Sports ES',
  'Trail 50',
  'Trail 110',
  'Trail 125',
  'Trail 125 Big Wheel',
  'Trail 250',
  'CRF150R',
  'CRF150RB',
  'CRF250R',
  'CRF250RX',
  'CRF250RWE',
  'CRF450R',
  'CRF450RX',
  'CRF450RWE'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = offroad_segment.id 
  AND vm.name = model_name
);

-- Add 2025 model codes
WITH offroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    ('Dual Sport', 'XR150LS'),
    ('Dual Sport', 'CRF300LAS'),
    ('Dual Rally', 'CRF300LRAS'),
    ('NX500', 'NX500AS'),
    ('Africa Twin', 'CRF1100S'),
    ('Africa Twin Adventure Sports ES', 'CRF11004S'),
    ('Africa Twin Adventure Sports ES', 'CRF11004DS'),
    ('Trail 50', 'CRF50FS'),
    ('Trail 110', 'CRF110FS'),
    ('Trail 125', 'CRF125FS'),
    ('Trail 125 Big Wheel', 'CRF125FBS'),
    ('Trail 250', 'CRF250FS'),
    ('CRF150R', 'CRF150RS'),
    ('CRF150RB', 'CRF150RBS'),
    ('CRF250R', 'CRF250RS'),
    ('CRF250RX', 'CRF250RXS'),
    ('CRF250RWE', 'CRF250RWES'),
    ('CRF450R', 'CRF450RS'),
    ('CRF450RX', 'CRF450RXS'),
    ('CRF450RWE', 'CRF450RWES')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM offroad_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025);