/*
  # Messaging System Overhaul

  1. New Functions
    - `send_notification` - Creates notifications for users
    - `notify_on_new_message` - Trigger function for message notifications
  
  2. Changes
    - Ensure messages table has proper structure
    - Ensure notifications table has proper structure
    - Update triggers and functions to handle text content
    
  3. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Ensure messages table has the correct structure
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages(listing_id);
CREATE INDEX IF NOT EXISTS messages_read_idx ON messages(read);

-- Ensure notifications table has the correct structure
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  type text,
  action_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Create policies for messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can mark received messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND xmin = xmin);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create or replace the send_notification function
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Insert the notification with text content (not JSON)
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_body,
    p_type,
    p_action_url,
    p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create or replace the notify_on_new_message function
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  listing_info jsonb := NULL;
BEGIN
  -- Get sender name
  SELECT COALESCE(dealer_name, email) INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Get listing info if available
  IF NEW.listing_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', id,
      'make', make,
      'model', model,
      'year', year
    ) INTO listing_info
    FROM listings
    WHERE id = NEW.listing_id;
  END IF;
  
  -- Create notification with text content (not JSON)
  PERFORM send_notification(
    NEW.receiver_id,
    'New Message',
    CASE
      WHEN listing_info IS NULL THEN 'You received a new message from ' || sender_name
      ELSE 'You received a new message about ' || listing_info->>'year' || ' ' || listing_info->>'make' || ' ' || listing_info->>'model'
    END,
    'message',
    '/messages?dealer=' || NEW.sender_id || CASE WHEN NEW.listing_id IS NOT NULL THEN '&listing=' || NEW.listing_id ELSE '' END,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_id', NEW.id,
      'listing', listing_info
    )
  );
  
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS notify_on_new_message_trigger ON messages;
CREATE TRIGGER notify_on_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();