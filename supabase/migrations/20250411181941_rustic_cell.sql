/*
  # Make ryan@hondapenticton.com an admin user

  1. Changes
    - Updates the role of ryan@hondapenticton.com to 'admin'
    
  2. Security
    - Only updates the specific user
    - Maintains existing RLS policies
*/

UPDATE profiles
SET role = 'admin'
WHERE email = 'ryan@hondapenticton.com';