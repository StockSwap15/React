-- Check the role of Ryan@hondapenticton.com
DO $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE email = 'Ryan@hondapenticton.com';

  IF user_role IS NULL THEN
    RAISE NOTICE 'User not found';
  ELSE
    RAISE NOTICE 'User role: %', user_role;
  END IF;
END $$;

-- Ensure the user has admin role
UPDATE profiles
SET role = 'admin'
WHERE email = 'Ryan@hondapenticton.com'
AND role != 'admin';