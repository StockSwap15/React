/*
  # Fix message content column type

  1. Changes
    - Ensure the content column in messages table is text type
    - This prevents PostgREST from trying to parse message content as JSON
    
  2. Security
    - Maintain existing RLS policies
    - No security impact
*/

-- Alter the content column type to ensure it's text
ALTER TABLE messages
  ALTER COLUMN content TYPE text;

-- Verify the change by selecting a sample message
DO $$
DECLARE
  sample_content text;
BEGIN
  -- Try to get a sample message content
  SELECT content INTO sample_content
  FROM messages
  LIMIT 1;
  
  -- Log the result
  RAISE NOTICE 'Sample message content (now text type): %', sample_content;
END $$;