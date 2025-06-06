/*
  # Add Polaris Models Schema

  1. New Tables
    - `vehicle_segments` (ATV, RANGER, RZR, GENERAL)
    - `vehicle_models` (specific models for each segment)
    - `model_codes` (specific model codes)
    - Update listings table to use these references

  2. Security
    - Enable RLS
    - Add policies for public reading
*/

-- Create vehicle segments table
CREATE TABLE vehicle_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicle models table
CREATE TABLE vehicle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES vehicle_segments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(segment_id, name)
);

-- Create model codes table
CREATE TABLE model_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES vehicle_models(id) ON DELETE CASCADE,
  code text NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(model_id, code, year),
  CONSTRAINT year_check CHECK (year BETWEEN 2022 AND 2025)
);

-- Enable RLS
ALTER TABLE vehicle_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public reading of vehicle segments"
  ON vehicle_segments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public reading of vehicle models"
  ON vehicle_models FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public reading of model codes"
  ON model_codes FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX vehicle_models_segment_id_idx ON vehicle_models(segment_id);
CREATE INDEX model_codes_model_id_idx ON model_codes(model_id);
CREATE INDEX model_codes_year_idx ON model_codes(year);

-- Modify listings table
ALTER TABLE listings
ADD COLUMN segment_id uuid REFERENCES vehicle_segments(id),
ADD COLUMN model_id uuid REFERENCES vehicle_models(id),
ADD COLUMN model_code_id uuid REFERENCES model_codes(id);

-- Insert initial data
INSERT INTO vehicle_segments (name) VALUES
('ATV'),
('RANGER'),
('RZR'),
('GENERAL');

-- Insert ATV models
WITH atv_segment AS (SELECT id FROM vehicle_segments WHERE name = 'ATV')
INSERT INTO vehicle_models (segment_id, name)
SELECT atv_segment.id, model_name
FROM atv_segment,
UNNEST(ARRAY[
  'Sportsman XP 1000',
  'Sportsman 850',
  'Sportsman 570',
  'Scrambler XP 1000',
  'Phoenix 200'
]) AS model_name;

-- Insert RANGER models
WITH ranger_segment AS (SELECT id FROM vehicle_segments WHERE name = 'RANGER')
INSERT INTO vehicle_models (segment_id, name)
SELECT ranger_segment.id, model_name
FROM ranger_segment,
UNNEST(ARRAY[
  'RANGER XP 1000',
  'RANGER CREW XP 1000',
  'RANGER SP 570',
  'RANGER CREW SP 570'
]) AS model_name;

-- Insert RZR models
WITH rzr_segment AS (SELECT id FROM vehicle_segments WHERE name = 'RZR')
INSERT INTO vehicle_models (segment_id, name)
SELECT rzr_segment.id, model_name
FROM rzr_segment,
UNNEST(ARRAY[
  'RZR Pro R',
  'RZR Pro R 4',
  'RZR Turbo R',
  'RZR Turbo R 4',
  'RZR XP 1000',
  'RZR XP 4 1000'
]) AS model_name;

-- Insert GENERAL models
WITH general_segment AS (SELECT id FROM vehicle_segments WHERE name = 'GENERAL')
INSERT INTO vehicle_models (segment_id, name)
SELECT general_segment.id, model_name
FROM general_segment,
UNNEST(ARRAY[
  'GENERAL XP 1000',
  'GENERAL XP 4 1000',
  'GENERAL 1000',
  'GENERAL 4 1000'
]) AS model_name;

-- Add triggers for updated_at
CREATE TRIGGER handle_vehicle_segments_updated_at
  BEFORE UPDATE ON vehicle_segments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_vehicle_models_updated_at
  BEFORE UPDATE ON vehicle_models
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_model_codes_updated_at
  BEFORE UPDATE ON model_codes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();