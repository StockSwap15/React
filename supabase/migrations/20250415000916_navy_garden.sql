/*
  # Add 2025 GENERAL & XPEDITION Models and Codes

  1. Changes
    - Add new GENERAL & XPEDITION models
    - Add model codes for 2025 lineup
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new models that don't exist yet
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
  'Polaris XPEDITION XP Ultimate',
  'Polaris XPEDITION ADV Ultimate',
  'Polaris XPEDITION XP Northstar',
  'Polaris XPEDITION ADV Northstar',
  'GENERAL 4 1000 Sport',
  'GENERAL XP 4 1000 Sport',
  'GENERAL XP 4 1000 Premium',
  'GENERAL XP 4 1000 Ultimate',
  'Polaris XPEDITION XP 5 Ultimate',
  'Polaris XPEDITION ADV 5 Ultimate',
  'Polaris XPEDITION XP 5 Northstar',
  'Polaris XPEDITION ADV 5 Northstar'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = general_segment.id AND vm.name = model_name
);

-- Insert the specific 2025 model codes
WITH general_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'GENERAL'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    -- GENERAL 1000 Models
    ('GENERAL 1000 Sport', 'G25GAE99A4'),
    ('GENERAL 1000 Premium', 'G25GAP99AN'),
    
    -- GENERAL XP 1000 Models
    ('GENERAL XP 1000 Sport', 'G25GXE99A4'),
    ('GENERAL XP 1000 Premium', 'G25GXP99AM'),
    ('GENERAL XP 1000 Premium', 'G25GXP99AR'),
    ('GENERAL XP 1000 Ultimate', 'G25GXK99AM'),
    ('GENERAL XP 1000 Ultimate', 'G25GXK99AR'),
    
    -- XPEDITION Models
    ('Polaris XPEDITION XP Ultimate', 'G25G2K99AP'),
    ('Polaris XPEDITION ADV Ultimate', 'G25GVK99AP'),
    ('Polaris XPEDITION XP Northstar', 'G25G2W99AP'),
    ('Polaris XPEDITION XP Northstar', 'G25G2W99AB'),
    ('Polaris XPEDITION XP Northstar', 'G25G2W99AK'),
    ('Polaris XPEDITION ADV Northstar', 'G25GVW99AP'),
    ('Polaris XPEDITION ADV Northstar', 'G25GVW99AB'),
    ('Polaris XPEDITION ADV Northstar', 'G25GVW99AK'),
    
    -- GENERAL 4 Models
    ('GENERAL 4 1000 Sport', 'G25G4E99A4'),
    ('GENERAL XP 4 1000 Sport', 'G25GME99A4'),
    ('GENERAL XP 4 1000 Premium', 'G25GMP99AM'),
    ('GENERAL XP 4 1000 Premium', 'G25GMP99AR'),
    ('GENERAL XP 4 1000 Ultimate', 'G25GMK99AM'),
    ('GENERAL XP 4 1000 Ultimate', 'G25GMK99AR'),
    
    -- XPEDITION 5 Models
    ('Polaris XPEDITION XP 5 Ultimate', 'G25G5K99AP'),
    ('Polaris XPEDITION ADV 5 Ultimate', 'G25GZK99AP'),
    ('Polaris XPEDITION XP 5 Northstar', 'G25G5W99AP'),
    ('Polaris XPEDITION XP 5 Northstar', 'G25G5W99AB'),
    ('Polaris XPEDITION XP 5 Northstar', 'G25G5W99AK'),
    ('Polaris XPEDITION ADV 5 Northstar', 'G25GZW99AP'),
    ('Polaris XPEDITION ADV 5 Northstar', 'G25GZW99AB'),
    ('Polaris XPEDITION ADV 5 Northstar', 'G25GZW99AK')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM general_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);