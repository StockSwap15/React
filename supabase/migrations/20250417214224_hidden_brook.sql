/*
  # Update 2024 RZR Models and Codes

  1. Changes
    - Add new RZR models for different categories
    - Add 2024 model codes with proper color variants
    - Maintain existing relationships
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new RZR models that don't exist yet
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO vehicle_models (segment_id, name)
SELECT rzr_segment.id, model_name
FROM rzr_segment,
UNNEST(ARRAY[
  'RZR Pro XP Sport',
  'RZR Pro XP Premium',
  'RZR Pro XP Ultimate',
  'RZR Pro XP 4 Sport',
  'RZR Pro XP 4 Premium',
  'RZR Pro XP 4 Ultimate',
  'RZR Turbo R Sport',
  'RZR Turbo R Premium',
  'RZR Turbo R Ultimate',
  'RZR Turbo R 4 Sport',
  'RZR Turbo R 4 Premium',
  'RZR Turbo R 4 Ultimate'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = rzr_segment.id AND vm.name = model_name
);

-- Insert the 2024 RZR model codes
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
    -- RZR MULTI TERRAIN 64"
    ('RZR XP 1000 Sport', 'Z24NEE99A2'),
    ('RZR XP 1000 Premium', 'Z24NEC99AM'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99AM'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99AR'),

    -- RZR MULTI TERRAIN 64" TURBO
    ('RZR Pro XP Sport', 'Z24RAE92AG'),
    ('RZR Pro XP Premium', 'Z24RAB92AK'),
    ('RZR Pro XP Ultimate', 'Z24RAD92AK'),

    -- RZR WIDE OPEN 74"
    ('RZR Turbo R Sport', 'Z24GAE92AL'),
    ('RZR Turbo R Premium', 'Z24GAC92AN'),
    ('RZR Turbo R Premium', 'Z24GAC92AR'),
    ('RZR Turbo R Ultimate', 'Z24GAD92AL'),
    ('RZR Pro R Premium', 'Z24RGD52KAH'),
    ('RZR Pro R Ultimate', 'Z24RGD62KAH'),
    ('RZR Pro R Ultimate', 'Z24RGD62KAL'),

    -- RZR MULTI PASSENGER 64"
    ('RZR XP 4 1000 Sport', 'Z24NME99A2'),
    ('RZR XP 4 1000 Premium', 'Z24NMC99AM'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99AM'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99AR'),

    -- RZR MULTI PASSENGER 64" TURBO
    ('RZR Pro XP 4 Sport', 'Z24RAE92AG'),
    ('RZR Pro XP 4 Premium', 'Z24RB92AK'),
    ('RZR Pro XP 4 Ultimate', 'Z24RD92AK'),

    -- RZR MULTI PASSENGER WIDE OPEN 74"
    ('RZR Turbo R 4 Sport', 'Z24GAE92AL'),
    ('RZR Turbo R 4 Premium', 'Z24GAC92AN'),
    ('RZR Turbo R 4 Premium', 'Z24GAC92AR'),
    ('RZR Turbo R 4 Ultimate', 'Z24GAD92AL'),
    ('RZR Pro R 4 Premium', 'Z24RGD52KAH'),
    ('RZR Pro R 4 Ultimate', 'Z24RGD62KAH'),
    ('RZR Pro R 4 Ultimate', 'Z24RGD62KAL')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM rzr_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024);