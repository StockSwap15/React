/*
  # Add 2025 Polaris ATV Model Codes

  1. Changes
    - Add model codes for 2025 Polaris ATVs
    - Link codes to existing vehicle models
    
  2. Security
    - Maintain existing RLS policies
*/

-- Insert model codes for 2025 Polaris ATVs
WITH 
  atv_segment AS (
    SELECT id FROM vehicle_segments WHERE name = 'ATV'
  ),
  models AS (
    SELECT id, name 
    FROM vehicle_models 
    WHERE segment_id = (SELECT id FROM atv_segment)
  )
INSERT INTO model_codes (model_id, code, year)
SELECT 
  models.id,
  code,
  2025
FROM models
CROSS JOIN (
  VALUES
    -- Sportsman XP 1000
    ('Sportsman XP 1000', 'A25RME99AV'),
    ('Sportsman XP 1000', 'A25RME99AL'),
    ('Sportsman XP 1000', 'A25RME99AM'),
    ('Sportsman XP 1000', 'A25RME99AN'),
    ('Sportsman XP 1000', 'A25RME99AP'),
    
    -- Sportsman 850
    ('Sportsman 850', 'A25RME85AV'),
    ('Sportsman 850', 'A25RME85AL'),
    ('Sportsman 850', 'A25RME85AM'),
    ('Sportsman 850', 'A25RME85AN'),
    ('Sportsman 850', 'A25RME85AP'),
    
    -- Sportsman 570
    ('Sportsman 570', 'A25RME57AV'),
    ('Sportsman 570', 'A25RME57AL'),
    ('Sportsman 570', 'A25RME57AM'),
    ('Sportsman 570', 'A25RME57AN'),
    ('Sportsman 570', 'A25RME57AP'),
    
    -- Scrambler XP 1000
    ('Scrambler XP 1000', 'A25RSE99AV'),
    ('Scrambler XP 1000', 'A25RSE99AL'),
    ('Scrambler XP 1000', 'A25RSE99AM'),
    
    -- Phoenix 200
    ('Phoenix 200', 'A25RPE20AV'),
    ('Phoenix 200', 'A25RPE20AL')
) AS codes(model_name, code)
WHERE models.name = codes.model_name;