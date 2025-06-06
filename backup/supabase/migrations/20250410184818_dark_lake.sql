/*
  # Update admin user

  1. Changes
    - Updates or creates admin user in auth.users
    - Updates or creates corresponding profile in profiles table
    - Ensures admin role is set correctly

  2. Security
    - Maintains existing user data if present
    - Updates role to admin if needed
*/

DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  -- First check if the user exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'Ryan@hondapenticton.com';

  -- If user doesn't exist, create them
  IF existing_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at,
      email_confirmed_at,
      encrypted_password,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      'Ryan@hondapenticton.com',
      '{"provider":"email"}',
      '{"provider":"email","providers":["email"]}',
      now(),
      now(),
      now(),
      crypt('Admin1500', gen_salt('bf')),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO existing_user_id;
  END IF;

  -- Now handle the profile
  INSERT INTO public.profiles (
    id,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    existing_user_id,
    'Ryan@hondapenticton.com',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    updated_at = now();
END
$$;