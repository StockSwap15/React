/*
  # Add 2025 Polaris ATV Model Codes

  1. New Models
    - Add Sportsman 450 H.O. models and variants
    - Add Sportsman 570 models and variants
    - Add Sportsman 850 models and variants
    - Add Sportsman XP 1000 models and variants
    - Add Scrambler models and variants
    - Add Touring models and variants
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new models that don't exist yet
WITH atv_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'ATV'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT atv_segment.id, model_name
FROM atv_segment,
UNNEST(ARRAY[
  'Sportsman 450 H.O.',
  'Sportsman 450 H.O. Utility',
  'Sportsman 450 H.O. EPS',
  'Sportsman 570 Utility HD',
  'Sportsman 570 Premium',
  'Sportsman 570 Trail',
  'Sportsman 570 Hunt Edition',
  'Sportsman 570 Ultimate',
  'Sportsman 850 Premium',
  'Sportsman 850 Trail',
  'Sportsman XP 1000 Hunt Edition',
  'Sportsman XP 1000 Ultimate',
  'Sportsman 850 Mud Edition',
  'Scrambler 850',
  'Scrambler XP 1000 Mud Edition',
  'Scrambler XP 1000 S',
  'Sportsman Touring 570',
  'Sportsman Touring 570 EPS',
  'Sportsman Touring 570 Premium',
  'Sportsman X2 570',
  'Sportsman Touring 570 Ultimate',
  'Sportsman 6x6 570',
  'Sportsman Touring XP 1000 Trail'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = atv_segment.id AND vm.name = model_name
);

-- Insert model codes
WITH atv_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'ATV'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    -- Sportsman 450 H.O. Models
    ('Sportsman 450 H.O.', 'A25SEA50B1', 'Sage Green (CA)'),
    ('Sportsman 450 H.O.', 'A25SEA50B3', 'Orange Rust (CA)'),
    ('Sportsman 450 H.O. Utility', 'A25SEG50B1', 'Sage Green (CA)'),
    ('Sportsman 450 H.O. Utility', 'A25SEG50B3', 'Orange Rust (CA)'),
    ('Sportsman 450 H.O. EPS', 'A25SEE50B1', 'Sage Green (CA)'),
    
    -- Sportsman 570 Models
    ('Sportsman 570', 'A25SEA57A1', 'Sage Green'),
    ('Sportsman 570', 'A25SEA57A3', 'Orange Rust'),
    ('Sportsman 570', 'A25SEA57A5', 'Desert Sand'),
    ('Sportsman 570', 'A25SEA57A9', 'Polaris Pursuit Camo'),
    ('Sportsman 570 EPS', 'A25SEE57A1', 'Sage Green'),
    ('Sportsman 570 EPS', 'A25SEE57A3', 'Orange Rust'),
    ('Sportsman 570 EPS', 'A25SEE57A5', 'Desert Sand'),
    ('Sportsman 570 EPS', 'A25SEE57A9', 'Polaris Pursuit Camo'),
    ('Sportsman 570 Utility HD', 'A25SHS57AT', 'Stealth Gray'),
    ('Sportsman 570 Premium', 'A25SEZ57AG', 'Storm Gray'),
    ('Sportsman 570 Trail', 'A25SHY57AL', 'Onyx Black'),
    ('Sportsman 570 Trail', 'A25SHY57AN', 'Electric Blue'),
    ('Sportsman 570 Hunt Edition', 'A25SHS57A9', 'Polaris Pursuit Camo'),
    ('Sportsman 570 Ultimate', 'A25SHR57AM', 'Turbo Silver'),
    
    -- Sportsman 850 Models
    ('Sportsman 850', 'A25SXA85A1', 'Sage Green'),
    ('Sportsman 850', 'A25SXA85A6', 'Military Tan'),
    ('Sportsman 850 Premium', 'A25SXA85AP', 'Springfield Blue'),
    ('Sportsman 850 Premium', 'A25SXA85AM', 'Crimson Metallic'),
    ('Sportsman 850 Premium', 'A25SXA85A9', 'Polaris Pursuit Camo'),
    ('Sportsman 850 Trail', 'A25SXZ85AM', 'Crimson Metallic'),
    ('Sportsman 850 Trail', 'A25SXZ85AP', 'Springfield Blue'),
    ('Sportsman 850 Trail', 'A25SXZ85A9', 'Polaris Pursuit Camo'),
    ('Sportsman 850 Mud Edition', 'A25SNX85AM', 'Titanium Metallic'),
    
    -- Sportsman XP 1000 Models
    ('Sportsman XP 1000 Hunt Edition', 'A25SXR95AM', 'Polaris Pursuit Camo'),
    ('Sportsman XP 1000 Ultimate', 'A25SXR95AF', 'Turbo Silver'),
    
    -- Scrambler Models
    ('Scrambler 850', 'A25SXV85AA', 'Storm Gray'),
    ('Scrambler XP 1000 Mud Edition', 'A25SXN85AL', 'Onyx Black'),
    ('Scrambler XP 1000 S', 'A25SXE95AT', 'Lifted Lime'),
    ('Scrambler XP 1000 S', 'A25SXE95AF', 'Lava Orange'),
    
    -- Touring Models
    ('Sportsman Touring 570', 'A25SDA57AT', 'Indy Red'),
    ('Sportsman Touring 570 EPS', 'A25SDZ57A4', 'Stealth Gray'),
    ('Sportsman Touring 570 Premium', 'A25SDY57AP', 'Springfield Blue'),
    ('Sportsman Touring 570', 'A25SDY57AL', 'Onyx Black'),
    ('Sportsman X2 570', 'A25SDV57AM', 'Onyx Black'),
    ('Sportsman Touring 570 Ultimate', 'A25STY57AM', 'Granite Gray'),
    ('Sportsman 6x6 570', 'A25SEX57AT', 'Sage Green'),
    ('Sportsman Touring XP 1000 Trail', 'A25SYV95AH', 'Heavy Metal')
) AS mc(model_name, code, color)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM atv_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);