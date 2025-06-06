/*
  # Add 2024 Sportsman Models and Codes

  1. Changes
    - Add new Sportsman models if they don't exist
    - Add 2024 model codes with color variants
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new Sportsman models if they don't exist
WITH sportsman_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'Sportsman'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT sportsman_segment.id, model_name
FROM sportsman_segment,
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
  'Sportsman 570 Ride Command Edition',
  'Sportsman 850',
  'Sportsman 850 Premium',
  'Sportsman 850 Ultimate Trail',
  'Sportsman XP 1000 Ultimate Trail',
  'Sportsman 850 High Lifter Edition',
  'Scrambler 850',
  'Sportsman XP 1000 Hunt Edition',
  'Sportsman XP 1000 High Lifter Edition',
  'Scrambler XP 1000 S',
  'Sportsman XP 1000 S',
  'Sportsman Touring 570',
  'Sportsman Touring 570 EPS',
  'Sportsman Touring 570 Premium',
  'Sportsman 6x6 570',
  'Sportsman Touring 850',
  'Sportsman Touring XP 1000 Trail'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = sportsman_segment.id AND vm.name = model_name
);

-- Insert the 2024 model codes
WITH sportsman_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'Sportsman'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- Sportsman 450 H.O. Models
    ('Sportsman 450 H.O.', 'A24SEA50B1'),
    ('Sportsman 450 H.O.', 'A24SEA50B3'),
    ('Sportsman 450 H.O. Utility', 'A24SEG50B1'),
    ('Sportsman 450 H.O. Utility', 'A24SEG50B3'),
    ('Sportsman 450 H.O. EPS', 'A24SEE50B1'),
    ('Sportsman 450 H.O. EPS', 'A24SEE50B3'),
    
    -- Sportsman 570 Models
    ('Sportsman 570', 'A24SEA57A1'),
    ('Sportsman 570', 'A24SEA57A3'),
    ('Sportsman 570', 'A24SEA57A6'),
    ('Sportsman 570', 'A24SEA57A9'),
    ('Sportsman 570 EPS', 'A24SEE57A1'),
    ('Sportsman 570 EPS', 'A24SEE57A3'),
    ('Sportsman 570 EPS', 'A24SEE57A6'),
    ('Sportsman 570 EPS', 'A24SEE57A9'),
    ('Sportsman 570 Utility HD', 'A24SEK57A4'),
    
    -- Sportsman 570 Premium Models
    ('Sportsman 570 Premium', 'A24SEZ57AG'),
    ('Sportsman 570 Trail', 'A24SHY57AL'),
    ('Sportsman 570 Trail', 'A24SHY57AN'),
    ('Sportsman 570 Hunt Edition', 'A24SHD57A9'),
    ('Sportsman 570 Ride Command Edition', 'A24SHR57AM'),
    
    -- Sportsman 850 Models
    ('Sportsman 850', 'A24SXA85A1'),
    ('Sportsman 850', 'A24SXA85A6'),
    ('Sportsman 850 Premium', 'A24SXE85AM'),
    ('Sportsman 850 Premium', 'A24SXE85AP'),
    ('Sportsman 850 Premium', 'A24SXE85A9'),
    ('Sportsman 850 Ultimate Trail', 'A24SXZ85AM'),
    ('Sportsman 850 Ultimate Trail', 'A24SXZ85AP'),
    ('Sportsman 850 Ultimate Trail', 'A24SXZ85A9'),
    ('Sportsman XP 1000 Ultimate Trail', 'A24SXZ95AR'),
    
    -- High Performance Models
    ('Sportsman 850 High Lifter Edition', 'A24SXN85A4'),
    ('Scrambler 850', 'A24SVA85A4'),
    ('Sportsman XP 1000 Hunt Edition', 'A24SXD95A9'),
    ('Sportsman XP 1000 High Lifter Edition', 'A24SXM95AL'),
    ('Scrambler XP 1000 S', 'A24SGE95AT'),
    ('Sportsman XP 1000 S', 'A24SLZ95AH'),
    
    -- Touring Models
    ('Sportsman Touring 570', 'A24SDA57A5'),
    ('Sportsman Touring 570 EPS', 'A24SDE57A4'),
    ('Sportsman Touring 570 Premium', 'A24SJE57AX'),
    ('Sportsman 6x6 570', 'A24S6E57A1'),
    ('Sportsman Touring 850', 'A24SYE85AL'),
    ('Sportsman Touring XP 1000 Trail', 'A24SYY95AH')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM sportsman_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024
);