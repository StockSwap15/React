/*
  # Update 2024 Sportsman Models and Codes

  1. Changes
    - Add new Sportsman models if they don't exist
    - Add 2024 model codes for all Sportsman models
    - Ensure no duplicate entries
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new Sportsman models that don't exist yet
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
  'Scrambler 850',
  'Scrambler 850 High Lifter Edition',
  'Scrambler XP 1000 Hunt Edition',
  'Scrambler XP 1000 High Lifter Edition',
  'Scrambler XP 1000 S',
  'Sportsman Touring 570',
  'Sportsman Touring 570 EPS',
  'Sportsman Touring 570 Premium',
  'Sportsman Touring 850',
  'Sportsman Touring XP 1000',
  'Sportsman Touring XP 1000 Trail'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = sportsman_segment.id AND vm.name = model_name
);

-- Create temporary table for model codes
CREATE TEMP TABLE temp_model_codes (
  model_name text,
  code text
);

-- Insert model codes into temporary table
INSERT INTO temp_model_codes (model_name, code) VALUES
  -- ENTRY REC UTE
  ('Sportsman 450 H.O.', 'A24SEA50B1'),
  ('Sportsman 450 H.O.', 'A24SEA50B3'),
  ('Sportsman 450 H.O. Utility', 'A24SE50B1'),
  ('Sportsman 450 H.O. Utility', 'A24SE50B3'),
  ('Sportsman 450 H.O. EPS', 'A24SEE50B1'),
  ('Sportsman 450 H.O. EPS', 'A24SEE50B3'),

  -- 500 1-UP VALUE
  ('Sportsman 570', 'A24SE57A1'),
  ('Sportsman 570', 'A24SE57A3'),
  ('Sportsman 570 EPS', 'A24SEE57A5'),
  ('Sportsman 570 EPS', 'A24SEE57A9'),
  ('Sportsman 570 EPS', 'A24SEE57A1'),
  ('Sportsman 570 EPS', 'A24SEE57A3'),
  ('Sportsman 570 EPS', 'A24SEE57A6'),
  ('Sportsman 570 Utility HD', 'A24SEE57A4'),

  -- 500 1-UP PREMIUM
  ('Sportsman 570 Premium', 'A24SE57AG'),
  ('Sportsman 570 Trail', 'A24SH57A1'),
  ('Sportsman 570 Trail', 'A24SH57AN'),
  ('Sportsman 570 Hunt Edition', 'A24SHD57A9'),
  ('Sportsman 570 Ride Command Edition', 'A24SHR57AM'),

  -- BIG BORE
  ('Sportsman 850', 'A24SX85A1'),
  ('Sportsman 850', 'A24SX85AM'),
  ('Sportsman 850 Premium', 'A24SX85ASM'),
  ('Sportsman 850 Premium', 'A24SX85A9'),
  ('Sportsman 850 Premium', 'A24SX85AP'),
  ('Sportsman 850 Ultimate Trail', 'A24SX95AM'),
  ('Sportsman 850 Ultimate Trail', 'A24SX95A9'),
  ('Sportsman 850 Ultimate Trail', 'A24SX95AR'),
  ('Sportsman XP 1000 Ultimate Trail', 'A24SXZ95AR'),

  -- SPORT PERFORMANCE
  ('Scrambler 850 High Lifter Edition', 'A24SX85A4'),
  ('Scrambler 850', 'A24SX85AT'),
  ('Scrambler XP 1000 Hunt Edition', 'A24SX95AL'),
  ('Scrambler XP 1000 High Lifter Edition', 'A24SX95AM'),
  ('Scrambler XP 1000 S', 'A24SZ95AH'),
  ('Scrambler XP 1000 S', 'A24SZ95AL'),

  -- 2-UP
  ('Sportsman Touring 570', 'A24DS57A5'),
  ('Sportsman Touring 570 EPS', 'A24DSE57A1'),
  ('Sportsman Touring 570 Premium', 'A24DSE57AM'),
  ('Sportsman Touring 850', 'A24SY85A1'),
  ('Sportsman Touring XP 1000', 'A24SY95A9'),
  ('Sportsman Touring XP 1000 Trail', 'A24SY95AH');

-- Insert model codes from temporary table
WITH sportsman_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'Sportsman'
)
INSERT INTO model_codes (model_id, code, year)
SELECT DISTINCT
  vm.id,
  tmc.code,
  2024
FROM temp_model_codes tmc
JOIN vehicle_models vm ON vm.name = tmc.model_name
WHERE vm.segment_id = (SELECT id FROM sportsman_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes mc
  WHERE mc.model_id = vm.id
  AND mc.code = tmc.code
  AND mc.year = 2024
);

-- Clean up
DROP TABLE temp_model_codes;