/*
  # Add 2024 RANGER Models and Codes

  1. Changes
    - Add new RANGER models if they don't exist
    - Add 2024 model codes with color variants
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new RANGER models if they don't exist
WITH ranger_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RANGER'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT ranger_segment.id, model_name
FROM ranger_segment,
UNNEST(ARRAY[
  'RANGER SP 570',
  'RANGER SP 570 Premium',
  'RANGER SP 570 NorthStar Edition',
  'RANGER 570 Full-Size',
  'RANGER 1000',
  'RANGER 1000 EPS',
  'RANGER 1000 Premium',
  'RANGER XP 1000 Premium',
  'RANGER XP Kinetic Premium',
  'RANGER XP Kinetic Ultimate',
  'RANGER XP 1000 NorthStar Edition Premium',
  'RANGER XP 1000 NorthStar Edition Ultimate',
  'RANGER XP 1000 NorthStar Edition Trail Boss',
  'RANGER XD 1500 Premium',
  'RANGER XD 1500 NorthStar Edition Premium',
  'RANGER XD 1500 NorthStar Edition Ultimate',
  'RANGER CREW SP 570',
  'RANGER CREW SP 570 Premium',
  'RANGER CREW SP 570 NorthStar Edition',
  'RANGER CREW 570 Full-Size',
  'RANGER CREW 1000',
  'RANGER CREW 1000 Premium',
  'RANGER CREW XP 1000 Premium',
  'RANGER CREW XP 1000 Texas Edition',
  'RANGER CREW XP 1000 NorthStar Edition Premium',
  'RANGER CREW XP 1000 NorthStar Edition Ultimate',
  'RANGER CREW XP 1000 NorthStar Edition Trail Boss',
  'RANGER CREW XD 1500 Premium',
  'RANGER CREW XD 1500 NorthStar Edition Premium',
  'RANGER CREW XD 1500 NorthStar Edition Ultimate'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = ranger_segment.id AND vm.name = model_name
);

-- Insert the 2024 model codes
WITH ranger_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RANGER'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- RANGER SP 570 Models
    ('RANGER SP 570', 'R24MAA57B1'),
    ('RANGER SP 570 Premium', 'R24MAE57B4'),
    ('RANGER SP 570 Premium', 'R24MAE57B9'),
    ('RANGER SP 570 NorthStar Edition', 'R24MAU57B4'),
    ('RANGER SP 570 NorthStar Edition', 'R24MAU57B9'),
    ('RANGER 570 Full-Size', 'R24CCA57A1'),
    
    -- RANGER 1000 Models
    ('RANGER 1000', 'R24TAA99A1'),
    ('RANGER 1000 EPS', 'R24TAE99A1'),
    ('RANGER 1000 Premium', 'R24TAE99AD'),
    ('RANGER 1000 Premium', 'R24TAE99AM'),
    ('RANGER 1000 Premium', 'R24TAE99A9'),
    
    -- RANGER XP 1000 Models
    ('RANGER XP 1000 Premium', 'R24RRE99AK'),
    ('RANGER XP 1000 Premium', 'R24RRE99AZ'),
    ('RANGER XP 1000 Premium', 'R24RRE99AJ'),
    ('RANGER XP 1000 Premium', 'R24RRE99A9'),
    
    -- RANGER XP Kinetic Models
    ('RANGER XP Kinetic Premium', 'R24E3CC2BD'),
    ('RANGER XP Kinetic Ultimate', 'R24E3GC4BD'),
    ('RANGER XP Kinetic Ultimate', 'R24E3GC4B9'),
    
    -- RANGER XP 1000 NorthStar Models
    ('RANGER XP 1000 NorthStar Edition Premium', 'R24RRU99AK'),
    ('RANGER XP 1000 NorthStar Edition Premium', 'R24RRU99AZ'),
    ('RANGER XP 1000 NorthStar Edition Premium', 'R24RRU99AJ'),
    ('RANGER XP 1000 NorthStar Edition Premium', 'R24RRU99A9'),
    ('RANGER XP 1000 NorthStar Edition Ultimate', 'R24RRY99AK'),
    ('RANGER XP 1000 NorthStar Edition Ultimate', 'R24RRY99AZ'),
    ('RANGER XP 1000 NorthStar Edition Ultimate', 'R24RRY99AJ'),
    ('RANGER XP 1000 NorthStar Edition Ultimate', 'R24RRY99A9'),
    ('RANGER XP 1000 NorthStar Edition Trail Boss', 'R24RRV99AC'),
    
    -- RANGER XD 1500 Models
    ('RANGER XD 1500 Premium', 'R24XAE1RBH'),
    ('RANGER XD 1500 NorthStar Edition Premium', 'R24XAL1RBH'),
    ('RANGER XD 1500 NorthStar Edition Premium', 'R24XAL1RBS'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R24XAW1RBH'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R24XAW1RBS'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R24XAW1RB9'),
    
    -- RANGER CREW SP 570 Models
    ('RANGER CREW SP 570', 'R24M4A57B1'),
    ('RANGER CREW SP 570 Premium', 'R24M4E57B4'),
    ('RANGER CREW SP 570 Premium', 'R24M4E57B9'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R24M4U57B4'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R24M4U57B9'),
    ('RANGER CREW 570 Full-Size', 'R24CDA57A1'),
    
    -- RANGER CREW 1000 Models
    ('RANGER CREW 1000', 'R24T6A99A1'),
    ('RANGER CREW 1000 Premium', 'R24T6E99AD'),
    ('RANGER CREW 1000 Premium', 'R24T6E99AM'),
    ('RANGER CREW 1000 Premium', 'R24T6E99A9'),
    
    -- RANGER CREW XP 1000 Models
    ('RANGER CREW XP 1000 Premium', 'R24RSE99AK'),
    ('RANGER CREW XP 1000 Premium', 'R24RSE99AZ'),
    ('RANGER CREW XP 1000 Premium', 'R24RSE99AJ'),
    ('RANGER CREW XP 1000 Premium', 'R24RSE99A9'),
    ('RANGER CREW XP 1000 Texas Edition', 'R24RSF99AY'),
    
    -- RANGER CREW XP 1000 NorthStar Models
    ('RANGER CREW XP 1000 NorthStar Edition Premium', 'R24RSU99AK'),
    ('RANGER CREW XP 1000 NorthStar Edition Premium', 'R24RSU99AZ'),
    ('RANGER CREW XP 1000 NorthStar Edition Premium', 'R24RSU99AJ'),
    ('RANGER CREW XP 1000 NorthStar Edition Premium', 'R24RSU99A9'),
    ('RANGER CREW XP 1000 NorthStar Edition Ultimate', 'R24RSY99AK'),
    ('RANGER CREW XP 1000 NorthStar Edition Ultimate', 'R24RSY99AZ'),
    ('RANGER CREW XP 1000 NorthStar Edition Ultimate', 'R24RSY99AJ'),
    ('RANGER CREW XP 1000 NorthStar Edition Ultimate', 'R24RSY99A9'),
    ('RANGER CREW XP 1000 NorthStar Edition Trail Boss', 'R24RSV99AC'),
    
    -- RANGER CREW XD 1500 Models
    ('RANGER CREW XD 1500 Premium', 'R24X6E1RBH'),
    ('RANGER CREW XD 1500 NorthStar Edition Premium', 'R24X6L1RBH'),
    ('RANGER CREW XD 1500 NorthStar Edition Premium', 'R24X6L1RBS'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R24X6W1RBH'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R24X6W1RBS'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R24X6W1RB9')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM ranger_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024
);