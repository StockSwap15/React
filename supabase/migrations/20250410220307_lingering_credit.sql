/*
  # Fix admin user creation

  1. Changes
    - Create admin user with correct auth setup
    - Create corresponding profile
    - Remove confirmed_at from insert as it's a generated column
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create or update admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth.users WHERE email = 'Ryan@hondapenticton.com';
  DELETE FROM profiles WHERE email = 'Ryan@hondapenticton.com';

  -- Create new admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'Ryan@hondapenticton.com',
    crypt('Admin1500', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    now()
  )
  RETURNING id INTO admin_user_id;

  -- Create admin profile
  INSERT INTO profiles (
    id,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'Ryan@hondapenticton.com',
    'admin',
    now(),
    now()
  );
END
$$;