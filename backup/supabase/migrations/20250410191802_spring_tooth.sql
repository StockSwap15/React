/*
  # Fix auth schema and policies

  1. Changes
    - Update auth.users table if it doesn't exist
    - Update profiles foreign key constraint
    - Add necessary policies if they don't exist
*/

-- Create the auth.users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid NOT NULL PRIMARY KEY,
      instance_id uuid,
      aud varchar(255),
      role varchar(255),
      email varchar(255),
      encrypted_password varchar(255),
      email_confirmed_at timestamp with time zone,
      invited_at timestamp with time zone,
      confirmation_token varchar(255),
      confirmation_sent_at timestamp with time zone,
      recovery_token varchar(255),
      recovery_sent_at timestamp with time zone,
      email_change_token_new varchar(255),
      email_change varchar(255),
      email_change_sent_at timestamp with time zone,
      last_sign_in_at timestamp with time zone,
      raw_app_meta_data jsonb,
      raw_user_meta_data jsonb,
      is_super_admin boolean,
      created_at timestamp with time zone,
      updated_at timestamp with time zone,
      phone varchar(255) NULL,
      phone_confirmed_at timestamp with time zone,
      phone_change varchar(255) NULL,
      phone_change_token varchar(255) NULL,
      phone_change_sent_at timestamp with time zone,
      confirmed_at timestamp with time zone,
      email_change_token_current varchar(255) NULL,
      email_change_confirm_status smallint,
      banned_until timestamp with time zone,
      reauthentication_token varchar(255) NULL,
      reauthentication_sent_at timestamp with time zone,
      CONSTRAINT users_email_key UNIQUE (email),
      CONSTRAINT users_phone_key UNIQUE (phone)
    );

    -- Enable RLS on auth.users if table was just created
    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop the policy if it exists and recreate it
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own user data." ON auth.users;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own user data.'
  ) THEN
    CREATE POLICY "Users can view own user data." ON auth.users
      FOR SELECT TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Update profiles foreign key to reference auth.users
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      DROP CONSTRAINT profiles_id_fkey;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
END $$;