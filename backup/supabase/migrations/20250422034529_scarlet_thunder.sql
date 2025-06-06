/*
  # Add 2024 GENERAL Models and Codes

  1. Changes
    - Add new GENERAL models if they don't exist
    - Add 2024 model codes with color variants
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new GENERAL models if they don't exist
WITH general_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'GENERAL'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT general_segment.id, model_name
FROM general_segment,
UNNEST(ARRAY[
  'GENERAL 1000 Sport',
  'GENERAL 1000 Premium',
  'GENERAL XP 1000 Sport',
  'GENERAL XP 1000 Premium',
  'GENERAL XP 1000 Ultimate',
  'Polaris XPEDITION XP Premium',
  'Polaris XPEDITION XP Ultimate',
  'Polaris XPEDITION ADV Premium',
  'Polaris XPEDITION ADV Ultimate',
  'Polaris XPEDITION XP Northstar',
  'Polaris XPEDITION ADV Northstar',
  'GENERAL XP 4 1000 Sport',
  'GENERAL XP 4 1000 Premium',
  'GENERAL XP 4 1000 Ultimate',
  'Polaris XPEDITION XP 5 Premium',
  'Polaris XPEDITION XP 5 Ultimate',
  'Polaris XPEDITION ADV 5 Premium',
  'Polaris XPEDITION ADV 5 Ultimate',
  'Polaris XPEDITION XP 5 Northstar',
  'Polaris XPEDITION ADV 5 Northstar'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = general_segment.id AND vm.name = model_name
);

-- Insert the 2024 model codes
WITH general_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'GENERAL'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- GENERAL 1000 Models
    ('GENERAL 1000 Sport', 'G24GAE99A4'),
    ('GENERAL 1000 Premium', 'G24GAP99AF'),
    
    -- GENERAL XP 1000 Models
    ('GENERAL XP 1000 Sport', 'G24GXE99A4'),
    ('GENERAL XP 1000 Premium', 'G24GXP99AN'),
    ('GENERAL XP 1000 Premium', 'G24GXP99AH'),
    ('GENERAL XP 1000 Ultimate', 'G24GXK99AN'),
    ('GENERAL XP 1000 Ultimate', 'G24GXK99AH'),
    
    -- XPEDITION Models
    ('Polaris XPEDITION XP Premium', 'G24G2P99AB'),
    ('Polaris XPEDITION XP Premium', 'G24G2P99AH'),
    ('Polaris XPEDITION XP Ultimate', 'G24G2K99AB'),
    ('Polaris XPEDITION XP Ultimate', 'G24G2K99AH'),
    ('Polaris XPEDITION ADV Premium', 'G24GVP99AF'),
    ('Polaris XPEDITION ADV Premium', 'G24GVP99AN'),
    ('Polaris XPEDITION ADV Ultimate', 'G24GVK99AF'),
    ('Polaris XPEDITION ADV Ultimate', 'G24GVK99AN'),
    ('Polaris XPEDITION XP Northstar', 'G24G2W99AB'),
    ('Polaris XPEDITION XP Northstar', 'G24G2W99AH'),
    ('Polaris XPEDITION ADV Northstar', 'G24GVW99AF'),
    ('Polaris XPEDITION ADV Northstar', 'G24GVW99AN'),
    
    -- GENERAL 4 Models
    ('GENERAL XP 4 1000 Sport', 'G24GME99A4'),
    ('GENERAL XP 4 1000 Premium', 'G24GMP99AN'),
    ('GENERAL XP 4 1000 Premium', 'G24GMP99AH'),
    ('GENERAL XP 4 1000 Ultimate', 'G24GMK99AN'),
    ('GENERAL XP 4 1000 Ultimate', 'G24GMK99AH'),
    
    -- XPEDITION 5 Models
    ('Polaris XPEDITION XP 5 Premium', 'G24G5P99AB'),
    ('Polaris XPEDITION XP 5 Premium', 'G24G5P99AH'),
    ('Polaris XPEDITION XP 5 Ultimate', 'G24G5K99AB'),
    ('Polaris XPEDITION XP 5 Ultimate', 'G24G5K99AH'),
    ('Polaris XPEDITION ADV 5 Premium', 'G24GZP99AF'),
    ('Polaris XPEDITION ADV 5 Premium', 'G24GZP99AN'),
    ('Polaris XPEDITION ADV 5 Ultimate', 'G24GZK99AF'),
    ('Polaris XPEDITION ADV 5 Ultimate', 'G24GZK99AN'),
    ('Polaris XPEDITION XP 5 Northstar', 'G24G5W99AB'),
    ('Polaris XPEDITION XP 5 Northstar', 'G24G5W99AH'),
    ('Polaris XPEDITION ADV 5 Northstar', 'G24GZW99AF'),
    ('Polaris XPEDITION ADV 5 Northstar', 'G24GZW99AN')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM general_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024
);