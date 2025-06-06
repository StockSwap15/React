/*
  # Remove duplicate Rubicon model

  1. Changes
    - Delete the Rubicon model
    - Keep only Rubicon 700
    - Transfer any model codes from Rubicon to Rubicon 700
    
  2. Security
    - Maintain existing RLS policies
*/

-- First, get the IDs of both models
WITH honda_atv_segment AS (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
),
rubicon_model AS (
  SELECT id FROM vehicle_models 
  WHERE name = 'Rubicon'
  AND segment_id = (SELECT id FROM honda_atv_segment)
),
rubicon_700_model AS (
  SELECT id FROM vehicle_models 
  WHERE name = 'Rubicon 700'
  AND segment_id = (SELECT id FROM honda_atv_segment)
)
-- Update any model codes from Rubicon to point to Rubicon 700
UPDATE model_codes
SET model_id = (SELECT id FROM rubicon_700_model)
WHERE model_id = (SELECT id FROM rubicon_model)
AND NOT EXISTS (
  -- Don't transfer if code already exists for Rubicon 700
  SELECT 1 FROM model_codes mc2
  WHERE mc2.model_id = (SELECT id FROM rubicon_700_model)
  AND mc2.code = model_codes.code
  AND mc2.year = model_codes.year
);

-- Delete any remaining model codes for Rubicon
DELETE FROM model_codes
WHERE model_id = (
  SELECT id FROM vehicle_models 
  WHERE name = 'Rubicon'
  AND segment_id = (
    SELECT id FROM vehicle_segments 
    WHERE name = 'ATV'
    AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
  )
);

-- Finally delete the Rubicon model
DELETE FROM vehicle_models
WHERE name = 'Rubicon'
AND segment_id = (
  SELECT id FROM vehicle_segments 
  WHERE name = 'ATV'
  AND brand_id = (SELECT id FROM vehicle_brands WHERE name = 'Honda')
);