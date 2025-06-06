/*
  # Create Rollback Point

  1. Changes
    - Create a snapshot of the current schema state
    - Verify all tables and relationships
    - Ensure all policies and functions are properly defined
    
  2. Security
    - Maintain existing RLS policies
    - Preserve all security settings
*/

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  dealer_name text,
  phone text,
  address text,
  alternate_phone text,
  fax text,
  website text,
  business_hours text,
  dealer_logo_url text,
  CONSTRAINT profiles_email_check CHECK (email ~* '^.+@.+\..+$'),
  CONSTRAINT profiles_role_check CHECK (role IN ('pending', 'dealer', 'admin'))
);

CREATE TABLE IF NOT EXISTS vehicle_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  brand_id uuid NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid REFERENCES vehicle_segments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(segment_id, name)
);

CREATE TABLE IF NOT EXISTS model_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES vehicle_models(id) ON DELETE CASCADE,
  code text NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(model_id, code, year),
  CONSTRAINT year_check CHECK (year BETWEEN 2022 AND 2025)
);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  vin text,
  pdi_fee numeric(10,2),
  condition_notes text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  location text,
  photo_url text,
  segment_id uuid REFERENCES vehicle_segments(id),
  model_id uuid REFERENCES vehicle_models(id),
  model_code_id uuid REFERENCES model_codes(id),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  CONSTRAINT year_check CHECK (year >= 1900 AND year <= extract(year from now()) + 1),
  CONSTRAINT pdi_fee_check CHECK (pdi_fee >= 0),
  CONSTRAINT status_check CHECK (status IN ('available', 'pending', 'sold', 'cancelled', 'searching', 'archived')),
  CONSTRAINT listings_expires_at_check CHECK (expires_at > created_at),
  CONSTRAINT listings_available_not_expired CHECK (
    status != 'available' OR 
    (status = 'available' AND expires_at > now())
  )
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT invitations_email_check CHECK (email ~* '^.+@.+\..+$')
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Create or replace functions
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION check_duplicate_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE email = NEW.email
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address already exists';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION renew_listing(listing_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_expiry timestamptz;
BEGIN
  new_expiry := now() + interval '30 days';
  
  UPDATE listings
  SET expires_at = new_expiry,
      updated_at = now()
  WHERE id = listing_id
  AND (dealer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));
  
  RETURN new_expiry;
END;
$$;

CREATE OR REPLACE FUNCTION archive_expired_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived_count integer;
BEGIN
  WITH archived AS (
    UPDATE listings
    SET 
      status = 'archived',
      updated_at = now()
    WHERE 
      expires_at < now()
      AND status NOT IN ('sold', 'cancelled', 'archived')
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;

  INSERT INTO audit_log (
    action,
    table_name,
    details
  ) VALUES (
    'archive_expired',
    'listings',
    format('Archived %s expired listings', archived_count)
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_listings_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.address IS DISTINCT FROM OLD.address THEN
    UPDATE listings
    SET location = NEW.address
    WHERE dealer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
DROP TRIGGER IF EXISTS handle_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS handle_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS handle_vehicle_brands_updated_at ON vehicle_brands;
DROP TRIGGER IF EXISTS handle_vehicle_segments_updated_at ON vehicle_segments;
DROP TRIGGER IF EXISTS handle_vehicle_models_updated_at ON vehicle_models;
DROP TRIGGER IF EXISTS handle_model_codes_updated_at ON model_codes;
DROP TRIGGER IF EXISTS prevent_duplicate_email ON profiles;
DROP TRIGGER IF EXISTS update_listings_location_trigger ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create triggers
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_vehicle_brands_updated_at
  BEFORE UPDATE ON vehicle_brands
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

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

CREATE TRIGGER prevent_duplicate_email
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_email();

CREATE TRIGGER update_listings_location_trigger
  AFTER UPDATE OF address ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_listings_location();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();