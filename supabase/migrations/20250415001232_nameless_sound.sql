/*
  # Add 2025 RZR Models and Codes

  1. Changes
    - Add new RZR models
    - Add model codes for 2025 lineup
    - Ensure proper relationships and constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add new models that don't exist yet
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
  'RZR Pro S Sport',
  'RZR Pro S Premium',
  'RZR Pro S Ultimate',
  'RZR Pro R Sport',
  'RZR Pro R Ultimate',
  'RZR Pro R Factory Armored LE',
  'RZR Pro R Race Replica LE',
  'RZR XP 4 1000 Sport',
  'RZR XP 4 1000 Premium',
  'RZR XP 4 1000 Ultimate',
  'RZR Pro XP 4 Sport',
  'RZR Pro XP 4 Premium',
  'RZR Pro XP 4 Ultimate',
  'RZR Pro S 4 Sport',
  'RZR Pro S 4 Premium',
  'RZR Pro S 4 Ultimate',
  'RZR Pro R 4 Sport',
  'RZR Pro R 4 Ultimate',
  'RZR Pro R 4 Factory Armored LE',
  'RZR Pro R 4 Race Replica LE'
]) AS model_name
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_models vm 
  WHERE vm.segment_id = rzr_segment.id AND vm.name = model_name
);

-- Insert the specific 2025 model codes
WITH rzr_segment AS (
  SELECT id FROM vehicle_segments WHERE name = 'RZR'
)
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2025
FROM (
  VALUES
    -- RZR Trail Models
    ('RZR Trail Sport', 'Z25A5E87A5'),
    ('RZR Trail Ultimate', 'Z25A5K87A6'),
    ('RZR Trail S Sport', 'Z25ASE87A5'),
    ('RZR Trail S Ultimate', 'Z25ASK99A6'),
    
    -- RZR XP 1000 Models
    ('RZR XP 1000 Sport', 'Z25NEE99A4'),
    ('RZR XP 1000 Sport', 'Z25NEE99A5'),
    ('RZR XP 1000 Premium', 'Z25NEB99A4'),
    ('RZR XP 1000 Ultimate', 'Z25NEF99A4'),
    ('RZR XP 1000 Ultimate', 'Z25NEF99A5'),
    
    -- RZR Pro XP Models
    ('RZR Pro XP Sport', 'Z25XPE92A4'),
    ('RZR Pro XP Premium', 'Z25XPB92AP'),
    ('RZR Pro XP Ultimate', 'Z25XPD92AA'),
    ('RZR Pro XP Ultimate', 'Z25XPD92AL'),
    ('RZR Pro XP Ultimate', 'Z25XPD92AP'),
    
    -- RZR Pro S Models
    ('RZR Pro S Sport', 'Z25SPE92A4'),
    ('RZR Pro S Premium', 'Z25SPB92AF'),
    ('RZR Pro S Ultimate', 'Z25SPD92AL'),
    ('RZR Pro S Ultimate', 'Z25SPD92AA'),
    ('RZR Pro S Ultimate', 'Z25SPD92AF'),
    
    -- RZR Pro R Models
    ('RZR Pro R Sport', 'Z25RPE2KA4'),
    ('RZR Pro R Ultimate', 'Z25RPD2KAK'),
    ('RZR Pro R Ultimate', 'Z25RPD2KAJ'),
    ('RZR Pro R Ultimate', 'Z25RPD2KAM'),
    ('RZR Pro R Factory Armored LE', 'Z25RPP2KAE'),
    ('RZR Pro R Race Replica LE', 'Z25RPP2KBL'),
    
    -- RZR XP 4 1000 Models
    ('RZR XP 4 1000 Sport', 'Z25NME99A4'),
    ('RZR XP 4 1000 Sport', 'Z25NME99A5'),
    ('RZR XP 4 1000 Premium', 'Z25NMB99A4'),
    ('RZR XP 4 1000 Ultimate', 'Z25NMF99A4'),
    ('RZR XP 4 1000 Ultimate', 'Z25NMF99A5'),
    
    -- RZR Pro XP 4 Models
    ('RZR Pro XP 4 Sport', 'Z25X4E92A4'),
    ('RZR Pro XP 4 Premium', 'Z25X4B92AP'),
    ('RZR Pro XP 4 Ultimate', 'Z25X4D92AA'),
    ('RZR Pro XP 4 Ultimate', 'Z25X4D92AL'),
    ('RZR Pro XP 4 Ultimate', 'Z25X4D92AP'),
    
    -- RZR Pro S 4 Models
    ('RZR Pro S 4 Sport', 'Z25S4E92A4'),
    ('RZR Pro S 4 Premium', 'Z25S4B92AF'),
    ('RZR Pro S 4 Ultimate', 'Z25S4D92AL'),
    ('RZR Pro S 4 Ultimate', 'Z25S4D92AA'),
    ('RZR Pro S 4 Ultimate', 'Z25S4D92AF'),
    
    -- RZR Pro R 4 Models
    ('RZR Pro R 4 Sport', 'Z25R4E2KA4'),
    ('RZR Pro R 4 Ultimate', 'Z25R4D2KAK'),
    ('RZR Pro R 4 Ultimate', 'Z25R4D2KAJ'),
    ('RZR Pro R 4 Ultimate', 'Z25R4D2KAM'),
    ('RZR Pro R 4 Factory Armored LE', 'Z25R4P2KAE'),
    ('RZR Pro R 4 Race Replica LE', 'Z25R4P2KBL')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id = (SELECT id FROM rzr_segment)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2025
);