/*
  # Create Auth Schema

  1. New Tables
    - `users` table for Supabase Auth
      - `id` (uuid, primary key)
      - `instance_id` (uuid)
      - `aud` (varchar)
      - `role` (varchar)
      - `email` (varchar)
      - `encrypted_password` (varchar)
      - `email_confirmed_at` (timestamp with time zone)
      - `invited_at` (timestamp with time zone)
      - `confirmation_token` (varchar)
      - `confirmation_sent_at` (timestamp with time zone)
      - `recovery_token` (varchar)
      - `recovery_sent_at` (timestamp with time zone)
      - `email_change_token_new` (varchar)
      - `email_change` (varchar)
      - `email_change_sent_at` (timestamp with time zone)
      - `last_sign_in_at` (timestamp with time zone)
      - `raw_app_meta_data` (jsonb)
      - `raw_user_meta_data` (jsonb)
      - `is_super_admin` (boolean)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
      - `phone` (varchar null)
      - `phone_confirmed_at` (timestamp with time zone)
      - `phone_change` (varchar null)
      - `phone_change_token` (varchar null)
      - `phone_change_sent_at` (timestamp with time zone)
      - `confirmed_at` (timestamp with time zone)
      - `email_change_token_current` (varchar null)
      - `email_change_confirm_status` (smallint)
      - `banned_until` (timestamp with time zone)
      - `reauthentication_token` (varchar null)
      - `reauthentication_sent_at` (timestamp with time zone)

  2. Security
    - Enable RLS on users table
    - Add policies for authenticated users
*/

-- Create the auth.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid NULL,
  id uuid NOT NULL UNIQUE,
  aud varchar(255) NULL,
  role varchar(255) NULL,
  email varchar(255) UNIQUE NULL,
  encrypted_password varchar(255) NULL,
  email_confirmed_at timestamp with time zone NULL,
  invited_at timestamp with time zone NULL,
  confirmation_token varchar(255) NULL,
  confirmation_sent_at timestamp with time zone NULL,
  recovery_token varchar(255) NULL,
  recovery_sent_at timestamp with time zone NULL,
  email_change_token_new varchar(255) NULL,
  email_change varchar(255) NULL,
  email_change_sent_at timestamp with time zone NULL,
  last_sign_in_at timestamp with time zone NULL,
  raw_app_meta_data jsonb NULL,
  raw_user_meta_data jsonb NULL,
  is_super_admin boolean NULL,
  created_at timestamp with time zone NULL,
  updated_at timestamp with time zone NULL,
  phone varchar(255) NULL,
  phone_confirmed_at timestamp with time zone NULL,
  phone_change varchar(255) NULL,
  phone_change_token varchar(255) NULL,
  phone_change_sent_at timestamp with time zone NULL,
  confirmed_at timestamp with time zone NULL,
  email_change_token_current varchar(255) NULL,
  email_change_confirm_status smallint NULL,
  banned_until timestamp with time zone NULL,
  reauthentication_token varchar(255) NULL,
  reauthentication_sent_at timestamp with time zone NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own user data." ON auth.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Ensure the auth schema exists and is in the search_path
CREATE SCHEMA IF NOT EXISTS auth;
ALTER DATABASE postgres SET search_path TO public, auth;