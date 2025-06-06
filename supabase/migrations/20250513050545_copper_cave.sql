/*
  # Remove Messaging System

  1. Changes
    - Drop messages table
    - Drop notifications table
    - Drop related functions and triggers
    
  2. Security
    - Clean up RLS policies
*/

-- First, drop the triggers that depend on the functions
DROP TRIGGER IF EXISTS notify_on_new_message_trigger ON messages;
DROP TRIGGER IF EXISTS notify_on_new_listing_trigger ON listings;

-- Then drop the functions
DROP FUNCTION IF EXISTS notify_on_new_message();
DROP FUNCTION IF EXISTS notify_on_new_listing();
DROP FUNCTION IF EXISTS send_notification(uuid, text, text, text, text, jsonb);

-- Finally drop the tables
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;

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