/*
  # Add 2024 RZR Models and Codes

  1. Changes
    - Add new RZR models if they don't exist
    - Add 2024 model codes with color variants
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new RZR models if they don't exist
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT rzr_segment.id, model_name
FROM rzr_segment,
UNNEST(ARRAY[
  'RZR Trail Sport',
  'RZR Trail Ultimate',
  'RZR Trail S Sport',
  'RZR Trail S Ultimate',
  'RZR XP 1000 Sport',
  'RZR XP 1000 Premium',
  'RZR XP 1000 Ultimate',
  'RZR Pro XP Sport',
  'RZR Pro XP Premium',
  'RZR Pro XP Ultimate',
  'RZR Turbo R Sport',
  'RZR Turbo R Premium',
  'RZR Turbo R Ultimate',
  'RZR Pro R Premium',
  'RZR Pro R Ultimate',
  'RZR XP 4 1000 Sport',
  'RZR XP 4 1000 Premium',
  'RZR XP 4 1000 Ultimate',
  'RZR Pro XP 4 Sport',
  'RZR Pro XP 4 Premium',
  'RZR Pro XP 4 Ultimate',
  'RZR Turbo R 4 Sport',
  'RZR Turbo R 4 Premium',
  'RZR Turbo R 4 Ultimate',
  'RZR Pro R 4 Premium',
  'RZR Pro R 4 Ultimate'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = rzr_segment.id AND vm.name = model_name
);

-- Insert the 2024 model codes
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- RZR Trail Models
    ('RZR Trail Sport', 'Z24A5E87A5'),
    ('RZR Trail Ultimate', 'Z24A5K87A5'),
    ('RZR Trail S Sport', 'Z24ASE87A5'),
    ('RZR Trail S Ultimate', 'Z24ASK99A5'),
    
    -- RZR XP 1000 Models
    ('RZR XP 1000 Sport', 'Z24NEE99A2'),
    ('RZR XP 1000 Premium', 'Z24NEC99AM'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99AM'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99AR'),
    
    -- RZR Pro XP Models
    ('RZR Pro XP Sport', 'Z24RAE92AG'),
    ('RZR Pro XP Premium', 'Z24RAB92AK'),
    ('RZR Pro XP Ultimate', 'Z24RAD92AK'),
    
    -- RZR Turbo R Models
    ('RZR Turbo R Sport', 'Z24GAE92AL'),
    ('RZR Turbo R Premium', 'Z24GAC92AN'),
    ('RZR Turbo R Ultimate', 'Z24GAD92AN'),
    ('RZR Turbo R Ultimate', 'Z24GAD92AZ'),
    
    -- RZR Pro R Models
    ('RZR Pro R Premium', 'Z24RGC2KAH'),
    ('RZR Pro R Ultimate', 'Z24RGD2KAH'),
    ('RZR Pro R Ultimate', 'Z24RGD2KAL'),
    
    -- RZR XP 4 1000 Models
    ('RZR XP 4 1000 Sport', 'Z24NME99A2'),
    ('RZR XP 4 1000 Premium', 'Z24NMC99AM'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99AM'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99AR'),
    
    -- RZR Pro XP 4 Models
    ('RZR Pro XP 4 Sport', 'Z24R4E92AG'),
    ('RZR Pro XP 4 Premium', 'Z24R4B92AK'),
    ('RZR Pro XP 4 Ultimate', 'Z24R4D92AK'),
    
    -- RZR Turbo R 4 Models
    ('RZR Turbo R 4 Sport', 'Z24G4E92AL'),
    ('RZR Turbo R 4 Premium', 'Z24G4C92AN'),
    ('RZR Turbo R 4 Ultimate', 'Z24G4D92AN'),
    ('RZR Turbo R 4 Ultimate', 'Z24G4D92AZ'),
    
    -- RZR Pro R 4 Models
    ('RZR Pro R 4 Premium', 'Z24RMC2KAH'),
    ('RZR Pro R 4 Ultimate', 'Z24RMD2KAH'),
    ('RZR Pro R 4 Ultimate', 'Z24RMD2KAL')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM rzr_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024
);