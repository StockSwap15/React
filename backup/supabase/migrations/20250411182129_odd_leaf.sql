/*
  # Verify and ensure admin role

  1. Changes
    - Verifies and sets admin role for specific user
    - Adds logging for verification
*/

DO $$
BEGIN
    -- First verify if the role was set
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE email = 'ryan@hondapenticton.com' 
        AND role = 'admin'
    ) THEN
        -- If not set, update it
        UPDATE profiles 
        SET role = 'admin'
        WHERE email = 'ryan@hondapenticton.com';
        
        RAISE NOTICE 'Admin role set for ryan@hondapenticton.com';
    ELSE
        RAISE NOTICE 'Admin role already exists for ryan@hondapenticton.com';
    END IF;
END $$;