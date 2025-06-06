/*
  # Add Listings Table

  1. New Tables
    - `listings`
      - `id` (uuid, primary key)
      - `dealer_id` (uuid, references profiles)
      - `make` (text)
      - `model` (text)
      - `year` (integer)
      - `vin` (text)
      - `pdi_fee` (numeric)
      - `financing_type` (text)
      - `condition_notes` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Dealers can create listings
      - Everyone can view active listings
      - Dealers can update their own listings
*/

-- Create listings table
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  vin text NOT NULL,
  pdi_fee numeric(10,2) NOT NULL,
  financing_type text NOT NULL,
  condition_notes text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT year_check CHECK (year >= 1900 AND year <= extract(year from now()) + 1),
  CONSTRAINT pdi_fee_check CHECK (pdi_fee >= 0),
  CONSTRAINT status_check CHECK (status IN ('available', 'pending', 'sold', 'cancelled')),
  CONSTRAINT financing_type_check CHECK (financing_type IN ('cash_only', 'financed'))
);

-- Create indexes
CREATE INDEX listings_dealer_id_idx ON listings(dealer_id);
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_make_model_idx ON listings(make, model);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Dealers can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Everyone can view available listings"
  ON listings FOR SELECT
  TO public
  USING (status = 'available' OR (auth.uid() IS NOT NULL AND dealer_id = auth.uid()));

CREATE POLICY "Dealers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER handle_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();