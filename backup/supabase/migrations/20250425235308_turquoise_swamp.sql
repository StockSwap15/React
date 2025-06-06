/*
  # Add Honda On-Road Models

  1. Changes
    - Add On-Road segment for Honda
    - Add 2025 Honda On-Road models
    - Add model codes for each variant
    
  2. Security
    - Maintain existing RLS policies
*/

-- Get Honda brand ID
WITH honda_brand AS (
  SELECT id FROM vehicle_brands WHERE name = 'Honda'
)
-- Add On-Road segment if it doesn't exist
INSERT INTO vehicle_segments (name, brand_id)
SELECT 'On-Road', honda_brand.id
FROM honda_brand
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_segments 
  WHERE name = 'On-Road' 
  AND brand_id = honda_brand.id
);

-- Add On-Road models
WITH onroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'On-Road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT onroad_segment.id, model_name
FROM onroad_segment,
UNNEST(ARRAY[
  'Giorno',
  'Navi',
  'Grom',
  'Trail125',
  'Monkey',
  'CB500F',
  'CBR500R',
  'SCL500',
  'CBR650R',
  'CB750',
  'CB1000SP',
  'Fireblade SP',
  'Rebel 500',
  'Rebel 1100',
  'NT1100',
  'Gold Wing',
  'Gold Wing Tour'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = onroad_segment.id 
  AND vm.name = model_name
);

-- Add 2025 model codes
WITH onroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'On-Road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    ('Giorno', 'NCW50S'),
    ('Navi', 'NVA110S'),
    ('Grom', 'MSX125AS'),
    ('Trail125', 'CT125AS'),
    ('Monkey', 'Z125MAS'),
    ('CB500F', 'CB500FAS'),
    ('CBR500R', 'CBR500RAS'),
    ('SCL500', 'SCL500AS'),
    ('CBR650R', 'CBR650RACS'),
    ('CB750', 'CB750AS'),
    ('CB1000SP', 'CB1000SPS'),
    ('Fireblade SP', 'CBR1000SPS'),
    ('Rebel 500', 'CMX500AS'),
    ('Rebel 1100', 'CMX1100AS'),
    ('Rebel 1100', 'CMX1100DS'),
    ('Rebel 1100', 'CMX1100TS'),
    ('Rebel 1100', 'CMX1100DTS'),
    ('NT1100', 'NT1100AS'),
    ('NT1100', 'NT1100DS'),
    ('Gold Wing', 'GL1800BS'),
    ('Gold Wing', 'GL1800BDS'),
    ('Gold Wing Tour', 'GL1800SS'),
    ('Gold Wing Tour', 'GL1800DS'),
    ('Gold Wing Tour', 'GL1800DSS'),
    ('Gold Wing Tour', 'GL1800DAS')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM onroad_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);