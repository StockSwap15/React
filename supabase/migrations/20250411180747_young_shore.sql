/*
  # Set up storage bucket and policies

  1. Changes
    - Create storage schema if it doesn't exist
    - Create buckets and objects tables
    - Set up storage policies for authenticated users
    
  2. Security
    - Enable RLS on storage tables
    - Add policies for file access and management
*/

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Create objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL REFERENCES storage.buckets(id),
  name text NOT NULL,
  owner uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create listings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for buckets
CREATE POLICY "Bucket is public" ON storage.buckets
  FOR SELECT USING (public = true);

-- Create policies for objects
CREATE POLICY "Objects are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'listings');

CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listings' AND
    (LOWER(name) LIKE '%.jpg' OR
     LOWER(name) LIKE '%.jpeg' OR
     LOWER(name) LIKE '%.png' OR
     LOWER(name) LIKE '%.gif')
  );

CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (owner = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects (bucket_id);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects (name);
CREATE INDEX IF NOT EXISTS objects_owner_idx ON storage.objects (owner);