/*
  # Add Invitations Table

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `email` (text)
      - `token` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `used_at` (timestamptz)
      - `created_by` (uuid, references profiles)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT invitations_email_check CHECK (email ~* '^.+@.+\..+$')
);

-- Create indexes
CREATE INDEX invitations_email_idx ON invitations(email);
CREATE INDEX invitations_token_idx ON invitations(token);
CREATE INDEX invitations_created_by_idx ON invitations(created_by);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage invitations"
  ON invitations
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own invitation"
  ON invitations
  FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims')::json->>'email');