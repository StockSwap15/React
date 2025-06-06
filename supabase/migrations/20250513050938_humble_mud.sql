-- First, check if tables exist before dropping triggers
DO $$
BEGIN
  -- Check if messages table exists before dropping its trigger
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    DROP TRIGGER IF EXISTS notify_on_new_message_trigger ON messages;
  END IF;
END
$$;

-- Drop trigger on listings table
DROP TRIGGER IF EXISTS notify_on_new_listing_trigger ON listings;

-- Then drop the functions
DROP FUNCTION IF EXISTS notify_on_new_message();
DROP FUNCTION IF EXISTS notify_on_new_listing();
DROP FUNCTION IF EXISTS send_notification(uuid, text, text, text, text, jsonb);

-- Drop tables if they exist
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;

-- Log the cleanup
INSERT INTO audit_log (
  action,
  table_name,
  details
) VALUES (
  'schema_cleanup',
  'system',
  'Removed messaging and notification system'
);