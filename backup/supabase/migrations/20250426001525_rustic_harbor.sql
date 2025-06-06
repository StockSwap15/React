/*
  # Add 2024 Honda On-Road Models

  1. Changes
    - Add 2024 model codes for Honda On-Road segment
    - Update model names to match 2024 lineup
    - Ensure proper relationships between models and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add any missing models to the On-Road segment
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
  'Ruckus',
  'Grom',
  'Grom (ABS)',
  'Trail125 (ABS)',
  'Monkey',
  'CB300R (ABS)',
  'CB500F (ABS)',
  'CBR500R (ABS)',
  'SCL500 (ABS)',
  'CBR650R (ABS)',
  'CB1000R (ABS)',
  'Rebel 300 (ABS)',
  'Rebel 500 (ABS)',
  'Rebel 1100 (ABS)',
  'Rebel 1100 DCT (ABS)',
  'Rebel 1100 Touring (ABS)',
  'Rebel 1100 Touring DCT (ABS)',
  'Gold Wing',
  'Gold Wing DCT',
  'Gold Wing Tour',
  'Gold Wing Tour DCT',
  'Gold Wing Tour DCT Airbag'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = onroad_segment.id 
  AND vm.name = model_name
);

-- Add 2024 model codes
WITH onroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'On-Road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    ('Giorno', 'NCW50R'),
    ('Ruckus', 'NPS50R'),
    ('Grom', 'MSX125R'),
    ('Grom (ABS)', 'MSX125AR'),
    ('Trail125 (ABS)', 'CT125AR'),
    ('Monkey', 'Z125MAR'),
    ('CB300R (ABS)', 'CB300RAR'),
    ('CB500F (ABS)', 'CB500FAR'),
    ('CBR500R (ABS)', 'CBR500RAR'),
    ('SCL500 (ABS)', 'SCL500AR'),
    ('CBR650R (ABS)', 'CBR650RACR'),
    ('CB1000R (ABS)', 'CB1000RR'),
    ('Rebel 300 (ABS)', 'CMX300AR'),
    ('Rebel 500 (ABS)', 'CMX500AR'),
    ('Rebel 1100 (ABS)', 'CMX1100AR'),
    ('Rebel 1100 DCT (ABS)', 'CMX1100DR'),
    ('Rebel 1100 Touring (ABS)', 'CMX1100TR'),
    ('Rebel 1100 Touring DCT (ABS)', 'CMX1100DTR'),
    ('Gold Wing', 'GL1800BR'),
    ('Gold Wing DCT', 'GL1800BDR'),
    ('Gold Wing Tour', 'GL1800R'),
    ('Gold Wing Tour', 'GL1800SR'),
    ('Gold Wing Tour DCT', 'GL1800DR'),
    ('Gold Wing Tour DCT', 'GL1800DSR'),
    ('Gold Wing Tour DCT Airbag', 'GL1800DAR')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM onroad_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);