/*
  # Add 2025 Polaris ATV Models and Codes

  1. Changes
    - Add new ATV models if they don't exist
    - Add model codes for 2025 Polaris ATVs
    - Ensure proper relationships between segments, models, and codes
    
  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity with proper constraints
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
  'Sportsman 570',
  'Sportsman 570 EPS',
  'Sportsman 570 Utility HD',
  'Sportsman 570 Premium',
  'Sportsman 570 Trail',
  'Sportsman 570 Hunt Edition',
  'Sportsman 570 Ultimate',
  'Sportsman 850',
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

-- Insert the specific 2025 model codes
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
    ('Sportsman 450 H.O.', 'A25SEA50B1'),
    ('Sportsman 450 H.O.', 'A25SEA50B3'),
    ('Sportsman 450 H.O. Utility', 'A25SEG50B1'),
    ('Sportsman 450 H.O. Utility', 'A25SEG50B3'),
    ('Sportsman 450 H.O. EPS', 'A25SEE50B1'),
    ('Sportsman 570', 'A25SEA57A1'),
    ('Sportsman 570', 'A25SEA57A3'),
    ('Sportsman 570', 'A25SEA57A5'),
    ('Sportsman 570', 'A25SEA57A9'),
    ('Sportsman 570 EPS', 'A25SEE57A1'),
    ('Sportsman 570 EPS', 'A25SEE57A3'),
    ('Sportsman 570 EPS', 'A25SEE57A5'),
    ('Sportsman 570 EPS', 'A25SEE57A9'),
    ('Sportsman 570 Utility HD', 'A25SHS57AT'),
    ('Sportsman 570 Premium', 'A25SEZ57AG'),
    ('Sportsman 570 Trail', 'A25SHY57AL'),
    ('Sportsman 570 Trail', 'A25SHY57AN'),
    ('Sportsman 570 Hunt Edition', 'A25SHS57A9'),
    ('Sportsman 570 Ultimate', 'A25SHR57AM'),
    ('Sportsman 850', 'A25SXA85A1'),
    ('Sportsman 850', 'A25SXA85A6'),
    ('Sportsman 850 Premium', 'A25SXA85AP'),
    ('Sportsman 850 Premium', 'A25SXA85AM'),
    ('Sportsman 850 Premium', 'A25SXA85A9'),
    ('Sportsman 850 Trail', 'A25SXZ85AM'),
    ('Sportsman 850 Trail', 'A25SXZ85AP'),
    ('Sportsman 850 Trail', 'A25SXZ85A9'),
    ('Sportsman XP 1000 Hunt Edition', 'A25SXR95AM'),
    ('Sportsman XP 1000 Ultimate', 'A25SXR95AF'),
    ('Sportsman 850 Mud Edition', 'A25SNX85AM'),
    ('Scrambler 850', 'A25SXV85AA'),
    ('Scrambler XP 1000 Mud Edition', 'A25SXN85AL'),
    ('Scrambler XP 1000 S', 'A25SXE95AT'),
    ('Scrambler XP 1000 S', 'A25SXE95AF'),
    ('Sportsman Touring 570', 'A25SDA57AT'),
    ('Sportsman Touring 570 EPS', 'A25SDZ57A4'),
    ('Sportsman Touring 570 Premium', 'A25SDY57AP'),
    ('Sportsman Touring 570', 'A25SDY57AL'),
    ('Sportsman X2 570', 'A25SDV57AM'),
    ('Sportsman Touring 570 Ultimate', 'A25STY57AM'),
    ('Sportsman 6x6 570', 'A25SEX57AT'),
    ('Sportsman Touring XP 1000 Trail', 'A25SYV95AH')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM atv_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);