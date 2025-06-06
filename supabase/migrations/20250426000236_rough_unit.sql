/*
  # Restore On-Road and Off-road segments

  1. Changes
    - Restore On-Road models and codes
    - Restore Off-road models and codes
    
  2. Security
    - Maintain existing RLS policies
*/

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

-- Add 2025 On-Road model codes
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

-- Add 2025 Off-road model codes
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