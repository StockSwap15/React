/*
  # Add 2024 Honda Off-Road Models

  1. Changes
    - Add 2024 model codes for Honda Off-Road segment
    - Update model names to match 2024 lineup
    - Ensure proper relationships between models and codes
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add any missing models to the Off-Road segment
WITH offroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO vehicle_models (segment_id, name)
SELECT offroad_segment.id, model_name
FROM offroad_segment,
UNNEST(ARRAY[
  'XR150L',
  'CRF300L',
  'CRF300L ABS',
  'CRF300L Rally',
  'CRF450RL',
  'NX500 (ABS)',
  'Transalp',
  'Africa Twin',
  'Africa Twin Adventure Sports ES',
  'Africa Twin Adventure Sports ES DCT',
  'CRF110',
  'CRF125',
  'CRF125 Big Wheel',
  'CRF250F',
  'CRF150',
  'CRF150 Big Wheel',
  'CRF250R',
  'CRF250RX',
  'CRF450R',
  'CRF450RX',
  'CRF450RWE'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = offroad_segment.id 
  AND vm.name = model_name
);

-- Add 2024 model codes
WITH offroad_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'Off-road'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    ('XR150L', 'XR150LR'),
    ('CRF300L', 'CRF300LR'),
    ('CRF300L ABS', 'CRF300LAR'),
    ('CRF300L Rally', 'CRF300LRAR'),
    ('CRF450RL', 'CRF450RLR'),
    ('NX500 (ABS)', 'NX500AR'),
    ('Transalp', 'XL750R'),
    ('Africa Twin', 'CRF1100R'),
    ('Africa Twin Adventure Sports ES', 'CRF11004R'),
    ('Africa Twin Adventure Sports ES DCT', 'CRF11004DR'),
    ('CRF110', 'CRF110FR'),
    ('CRF125', 'CRF125FR'),
    ('CRF125 Big Wheel', 'CRF125FBR'),
    ('CRF250F', 'CRF250FR'),
    ('CRF150', 'CRF150RR'),
    ('CRF150 Big Wheel', 'CRF150RBR'),
    ('CRF250R', 'CRF250RR'),
    ('CRF250RX', 'CRF250RXR'),
    ('CRF450R', 'CRF450RR'),
    ('CRF450RX', 'CRF450RXR'),
    ('CRF450RWE', 'CRF450RWER')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM offroad_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);