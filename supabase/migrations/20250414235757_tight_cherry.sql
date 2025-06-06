/*
  # Add 2025 Polaris RANGER Models and Codes

  1. Changes
    - Add new RANGER models if they don't exist
    - Add model codes for 2025 Polaris RANGER models
    - Ensure proper relationships between segments, models, and codes
    
  2. Security
    - Maintain existing RLS policies
    - Preserve data integrity with proper constraints
*/

-- First add new models that don't exist yet
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
  'RANGER XP 1000 Northstar Edition Premium',
  'RANGER XP 1000 Northstar Edition Ultimate',
  'RANGER XP 1000 NorthStar Trail Boss Edition',
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
  'RANGER CREW XP 1000 Waterfowl Edition',
  'RANGER CREW XP 1000 Northstar Edition Premium',
  'RANGER CREW XP 1000 Northstar Edition Ultimate',
  'RANGER CREW XP 1000 NorthStar Texas Edition',
  'RANGER CREW XP 1000 NorthStar Trail Boss Edition',
  'RANGER CREW XD 1500 NorthStar Edition Premium',
  'RANGER CREW XD 1500 NorthStar Edition Ultimate'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = ranger_segment.id AND vm.name = model_name
);

-- Insert the specific 2025 model codes
WITH ranger_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RANGER'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    -- RANGER SP 570 Models
    ('RANGER SP 570', 'R25MAA57B1'),
    ('RANGER SP 570 Premium', 'R25MAE57B5'),
    ('RANGER SP 570 Premium', 'R25MAE57B6'),
    ('RANGER SP 570 NorthStar Edition', 'R25MAU57B5'),
    ('RANGER SP 570 NorthStar Edition', 'R25MAU57B6'),
    ('RANGER 570 Full-Size', 'R25CCA57A1'),
    
    -- RANGER 1000 Models
    ('RANGER 1000', 'R25TAA99A1'),
    ('RANGER 1000 EPS', 'R25TAE99A1'),
    ('RANGER 1000 Premium', 'R25TAE99AM'),
    ('RANGER 1000 Premium', 'R25TAE99AD'),
    ('RANGER 1000 Premium', 'R25TAE99AJ'),
    ('RANGER 1000 Premium', 'R25TAE99A9'),
    
    -- RANGER XP 1000 Models
    ('RANGER XP 1000 Premium', 'R25RRE99AL'),
    ('RANGER XP 1000 Premium', 'R25RRE99AS'),
    ('RANGER XP 1000 Premium', 'R25RRE99AP'),
    ('RANGER XP 1000 Premium', 'R25RRE99AK'),
    ('RANGER XP 1000 Premium', 'R25RRE99AF'),
    ('RANGER XP 1000 Premium', 'R25RRE99A9'),
    
    -- RANGER XP 1000 Northstar Models
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RRU99AL'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RRU99AS'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RRU99AP'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RRU99A9'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RR399AK'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RR399AP'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RR399AS'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RR399AF'),
    ('RANGER XP 1000 Northstar Edition Premium', 'R25RR399A9'),
    
    -- RANGER XP 1000 Northstar Ultimate Models
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99AL'),
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99AS'),
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99AP'),
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99AK'),
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99AF'),
    ('RANGER XP 1000 Northstar Edition Ultimate', 'R25RRY99A9'),
    
    -- RANGER XP 1000 Special Editions
    ('RANGER XP 1000 NorthStar Trail Boss Edition', 'R25RRV99AC'),
    
    -- RANGER XD 1500 Models
    ('RANGER XD 1500 NorthStar Edition Premium', 'R25XAL1RBM'),
    ('RANGER XD 1500 NorthStar Edition Premium', 'R25XAL1RBD'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R25XAW1RBD'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R25XAW1RBM'),
    ('RANGER XD 1500 NorthStar Edition Ultimate', 'R25XAW1RB9'),
    
    -- RANGER CREW SP 570 Models
    ('RANGER CREW SP 570', 'R25M4A57B1'),
    ('RANGER CREW SP 570 Premium', 'R25M4E57B5'),
    ('RANGER CREW SP 570 Premium', 'R25M4E57B6'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R25M4U57B5'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R25M4U57B6'),
    ('RANGER CREW 570 Full-Size', 'R25CDA57A1'),
    
    -- RANGER CREW 1000 Models
    ('RANGER CREW 1000', 'R25T6A99A1'),
    ('RANGER CREW 1000 Premium', 'R25T6E99AM'),
    ('RANGER CREW 1000 Premium', 'R25T6E99AD'),
    ('RANGER CREW 1000 Premium', 'R25T6E99AJ'),
    ('RANGER CREW 1000 Premium', 'R25T6E99A9'),
    
    -- RANGER CREW XP 1000 Models
    ('RANGER CREW XP 1000 Premium', 'R25RSE99AL'),
    ('RANGER CREW XP 1000 Premium', 'R25RSE99AS'),
    ('RANGER CREW XP 1000 Premium', 'R25RSE99AP'),
    ('RANGER CREW XP 1000 Premium', 'R25RSE99AK'),
    ('RANGER CREW XP 1000 Premium', 'R25RSE99AF'),
    ('RANGER CREW XP 1000 Premium', 'R25RSE99A9'),
    
    -- RANGER CREW XP 1000 Special Editions
    ('RANGER CREW XP 1000 Texas Edition', 'R25RSF99AY'),
    ('RANGER CREW XP 1000 Texas Edition', 'R25RSF99AL'),
    ('RANGER CREW XP 1000 Waterfowl Edition', 'R25RSB99AZ'),
    ('RANGER CREW XP 1000 Waterfowl Edition', 'R25RSB99AL'),
    
    -- RANGER CREW XP 1000 Northstar Models
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RSU99AS'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RSU99AP'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RSU99AL'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RSU99A9'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RS399AK'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RS399AP'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RS399AS'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RS399AF'),
    ('RANGER CREW XP 1000 Northstar Edition Premium', 'R25RS399A9'),
    
    -- RANGER CREW XP 1000 Northstar Ultimate Models
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99AL'),
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99AS'),
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99AP'),
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99AK'),
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99AF'),
    ('RANGER CREW XP 1000 Northstar Edition Ultimate', 'R25RSY99A9'),
    
    -- RANGER CREW XP 1000 Special Northstar Editions
    ('RANGER CREW XP 1000 NorthStar Texas Edition', 'R25RST99AY'),
    ('RANGER CREW XP 1000 NorthStar Trail Boss Edition', 'R25RSV99AC'),
    ('RANGER CREW XP 1000 NorthStar Texas Edition', 'R25RST99AL'),
    
    -- RANGER CREW XD 1500 Models
    ('RANGER CREW XD 1500 NorthStar Edition Premium', 'R25X6L1RBD'),
    ('RANGER CREW XD 1500 NorthStar Edition Premium', 'R25X6L1RBM'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R25X6W1RBD'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R25X6W1RBM'),
    ('RANGER CREW XD 1500 NorthStar Edition Ultimate', 'R25X6W1RB9')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM ranger_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);