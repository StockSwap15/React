/*
  # Add 2024 Polaris Model Codes

  1. Changes
    - Add model codes for 2024 model year
    - Maintain existing relationships with segments and models
    - Keep all 2025 data intact
    
  2. Security
    - Maintain existing RLS policies
*/

-- Insert 2024 model codes for existing models
WITH 
  sportsman_segment AS (
    SELECT id FROM vehicle_segments WHERE name = 'Sportsman'
  ),
  ranger_segment AS (
    SELECT id FROM vehicle_segments WHERE name = 'RANGER'
  ),
  rzr_segment AS (
    SELECT id FROM vehicle_segments WHERE name = 'RZR'
  ),
  general_segment AS (
    SELECT id FROM vehicle_segments WHERE name = 'GENERAL'
  )
INSERT INTO model_codes (model_id, code, year)
SELECT 
  vm.id,
  mc.code,
  2024
FROM (
  VALUES
    -- Sportsman Models
    ('Sportsman XP 1000', 'A24RME99AV'),
    ('Sportsman XP 1000', 'A24RME99AL'),
    ('Sportsman XP 1000', 'A24RME99AM'),
    ('Sportsman XP 1000', 'A24RME99AN'),
    ('Sportsman XP 1000', 'A24RME99AP'),
    ('Sportsman 850', 'A24RME85AV'),
    ('Sportsman 850', 'A24RME85AL'),
    ('Sportsman 850', 'A24RME85AM'),
    ('Sportsman 850', 'A24RME85AN'),
    ('Sportsman 850', 'A24RME85AP'),
    ('Sportsman 570', 'A24RME57AV'),
    ('Sportsman 570', 'A24RME57AL'),
    ('Sportsman 570', 'A24RME57AM'),
    ('Sportsman 570', 'A24RME57AN'),
    ('Sportsman 570', 'A24RME57AP'),
    ('Scrambler XP 1000', 'A24RSE99AV'),
    ('Scrambler XP 1000', 'A24RSE99AL'),
    ('Scrambler XP 1000', 'A24RSE99AM'),
    ('Phoenix 200', 'A24RPE20AV'),
    ('Phoenix 200', 'A24RPE20AL'),

    -- RANGER Models
    ('RANGER SP 570', 'R24MAA57B1'),
    ('RANGER SP 570 Premium', 'R24MAE57B5'),
    ('RANGER SP 570 Premium', 'R24MAE57B6'),
    ('RANGER SP 570 NorthStar Edition', 'R24MAU57B5'),
    ('RANGER SP 570 NorthStar Edition', 'R24MAU57B6'),
    ('RANGER XP 1000', 'R24RRE99AL'),
    ('RANGER XP 1000', 'R24RRE99AS'),
    ('RANGER XP 1000', 'R24RRE99AP'),
    ('RANGER XP 1000', 'R24RRE99AK'),
    ('RANGER XP 1000', 'R24RRE99AF'),
    ('RANGER XP 1000', 'R24RRE99A9'),
    ('RANGER CREW SP 570', 'R24M4A57B1'),
    ('RANGER CREW SP 570 Premium', 'R24M4E57B5'),
    ('RANGER CREW SP 570 Premium', 'R24M4E57B6'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R24M4U57B5'),
    ('RANGER CREW SP 570 NorthStar Edition', 'R24M4U57B6'),
    ('RANGER CREW XP 1000', 'R24RSE99AL'),
    ('RANGER CREW XP 1000', 'R24RSE99AS'),
    ('RANGER CREW XP 1000', 'R24RSE99AP'),
    ('RANGER CREW XP 1000', 'R24RSE99AK'),
    ('RANGER CREW XP 1000', 'R24RSE99AF'),
    ('RANGER CREW XP 1000', 'R24RSE99A9'),

    -- RZR Models
    ('RZR Pro R Sport', 'Z24RPE2KA4'),
    ('RZR Pro R Ultimate', 'Z24RPD2KAK'),
    ('RZR Pro R Ultimate', 'Z24RPD2KAJ'),
    ('RZR Pro R Ultimate', 'Z24RPD2KAM'),
    ('RZR Pro R Factory Armored LE', 'Z24RPP2KAE'),
    ('RZR Pro R Race Replica LE', 'Z24RPP2KBL'),
    ('RZR Pro R 4 Sport', 'Z24R4E2KA4'),
    ('RZR Pro R 4 Ultimate', 'Z24R4D2KAK'),
    ('RZR Pro R 4 Ultimate', 'Z24R4D2KAJ'),
    ('RZR Pro R 4 Ultimate', 'Z24R4D2KAM'),
    ('RZR Pro R 4 Factory Armored LE', 'Z24R4P2KAE'),
    ('RZR Pro R 4 Race Replica LE', 'Z24R4P2KBL'),
    ('RZR XP 1000 Sport', 'Z24NEE99A4'),
    ('RZR XP 1000 Sport', 'Z24NEE99A5'),
    ('RZR XP 1000 Premium', 'Z24NEB99A4'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99A4'),
    ('RZR XP 1000 Ultimate', 'Z24NEF99A5'),
    ('RZR XP 4 1000 Sport', 'Z24NME99A4'),
    ('RZR XP 4 1000 Sport', 'Z24NME99A5'),
    ('RZR XP 4 1000 Premium', 'Z24NMB99A4'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99A4'),
    ('RZR XP 4 1000 Ultimate', 'Z24NMF99A5'),

    -- GENERAL Models
    ('GENERAL XP 1000 Sport', 'G24GXE99A4'),
    ('GENERAL XP 1000 Premium', 'G24GXP99AM'),
    ('GENERAL XP 1000 Premium', 'G24GXP99AR'),
    ('GENERAL XP 1000 Ultimate', 'G24GXK99AM'),
    ('GENERAL XP 1000 Ultimate', 'G24GXK99AR'),
    ('GENERAL XP 4 1000 Sport', 'G24GME99A4'),
    ('GENERAL XP 4 1000 Premium', 'G24GMP99AM'),
    ('GENERAL XP 4 1000 Premium', 'G24GMP99AR'),
    ('GENERAL XP 4 1000 Ultimate', 'G24GMK99AM'),
    ('GENERAL XP 4 1000 Ultimate', 'G24GMK99AR')
) AS mc(model_name, code)
JOIN vehicle_models vm ON vm.name = mc.model_name
WHERE vm.segment_id IN (
  SELECT id FROM vehicle_segments 
  WHERE name IN ('Sportsman', 'RANGER', 'RZR', 'GENERAL')
)
AND NOT EXISTS (
  SELECT 1 FROM model_codes 
  WHERE model_id = vm.id 
  AND code = mc.code 
  AND year = 2024
);