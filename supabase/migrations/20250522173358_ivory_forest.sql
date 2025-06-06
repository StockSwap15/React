/*
  # Chat System Database Schema

  1. New Tables
    - `channels` - Stores chat channels
    - `messages` - Stores messages within channels
    - `channel_members` - Stores channel membership information
    - `chat_notifications` - Stores notifications for unread messages

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Ensure users can only access their own data
*/

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_group boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resource_type text, -- 'listing' or 'iso'
  resource_id uuid -- ID of the listing or ISO
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  PRIMARY KEY (channel_id, member_id)
);

-- Create chat_notifications table
CREATE TABLE IF NOT EXISTS chat_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS channels_created_by_idx ON channels(created_by);
CREATE INDEX IF NOT EXISTS channels_resource_idx ON channels(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS messages_channel_id_idx ON messages(channel_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS chat_notifications_user_id_idx ON chat_notifications(user_id);
CREATE INDEX IF NOT EXISTS chat_notifications_channel_id_idx ON chat_notifications(channel_id);
CREATE INDEX IF NOT EXISTS chat_notifications_read_idx ON chat_notifications(read) WHERE read = false;

-- Enable Row Level Security
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels table
CREATE POLICY "Users can select channels they are members of"
  ON channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_id = channels.id
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can select messages in channels they are members of"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_id = messages.channel_id
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into channels they are members of"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_id = messages.channel_id
      AND member_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- RLS Policies for channel_members table
CREATE POLICY "Users can select channel membership information"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.member_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert channel memberships if they created the channel"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels
      WHERE id = channel_members.channel_id
      AND created_by = auth.uid()
    ) OR
    member_id = auth.uid()
  );

CREATE POLICY "Users can update their own last_read_at timestamp"
  ON channel_members FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- RLS Policies for chat_notifications table
CREATE POLICY "Users can view their own notifications"
  ON chat_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON chat_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON chat_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to generate notifications for new messages
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  channel_name text;
  member_id uuid;
  member_cursor CURSOR FOR 
    SELECT cm.member_id 
    FROM channel_members cm 
    WHERE cm.channel_id = NEW.channel_id 
    AND cm.member_id != NEW.sender_id;
  resource_info jsonb := NULL;
BEGIN
  -- Get sender name
  SELECT COALESCE(dealer_name, email) INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Get channel name
  SELECT name INTO channel_name
  FROM channels
  WHERE id = NEW.channel_id;
  
  -- Create notification for each channel member except sender
  OPEN member_cursor;
  LOOP
    FETCH member_cursor INTO member_id;
    EXIT WHEN NOT FOUND;
    
    -- Create notification
    INSERT INTO chat_notifications (
      user_id,
      channel_id,
      message_id,
      title,
      body
    ) VALUES (
      member_id,
      NEW.channel_id,
      NEW.id,
      'New Message',
      sender_name || ' sent: ' || substring(NEW.content, 1, 50) || CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END
    );
  END LOOP;
  CLOSE member_cursor;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS notify_on_new_message_trigger ON messages;
CREATE TRIGGER notify_on_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();

-- Create function to get or create a resource channel
CREATE OR REPLACE FUNCTION get_or_create_resource_channel(
  p_resource_type text,
  p_resource_id uuid,
  p_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id uuid;
  v_user_id uuid := auth.uid();
  v_channel_name text;
  v_resource_info jsonb := NULL;
  v_owner_name text;
  v_resource_name text;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get owner name
  SELECT COALESCE(dealer_name, email) INTO v_owner_name
  FROM profiles
  WHERE id = p_owner_id;
  
  -- Get resource info based on type
  IF p_resource_type = 'listing' THEN
    SELECT jsonb_build_object(
      'id', id,
      'make', make,
      'model', model,
      'year', year
    ) INTO v_resource_info
    FROM listings
    WHERE id = p_resource_id;
    
    -- Set resource name
    SELECT year || ' ' || make || ' ' || model INTO v_resource_name
    FROM listings
    WHERE id = p_resource_id;
  ELSIF p_resource_type = 'iso' THEN
    SELECT jsonb_build_object(
      'id', id,
      'make', make,
      'model', model,
      'year', year
    ) INTO v_resource_info
    FROM listings
    WHERE id = p_resource_id AND status = 'searching';
    
    -- Set resource name
    SELECT year || ' ' || make || ' ' || model INTO v_resource_name
    FROM listings
    WHERE id = p_resource_id AND status = 'searching';
  END IF;
  
  -- Generate channel name
  v_channel_name := p_resource_type || ':' || p_resource_id;
  
  -- Check if channel already exists between these users
  SELECT c.id INTO v_channel_id
  FROM channels c
  JOIN channel_members cm1 ON c.id = cm1.channel_id AND cm1.member_id = v_user_id
  JOIN channel_members cm2 ON c.id = cm2.channel_id AND cm2.member_id = p_owner_id
  WHERE c.resource_type = p_resource_type AND c.resource_id = p_resource_id
  LIMIT 1;
  
  -- If channel doesn't exist, create it
  IF v_channel_id IS NULL THEN
    -- Insert new channel
    INSERT INTO channels (
      name,
      is_group,
      created_by,
      resource_type,
      resource_id
    ) VALUES (
      v_channel_name,
      false,
      v_user_id,
      p_resource_type,
      p_resource_id
    ) RETURNING id INTO v_channel_id;
    
    -- Add current user as member
    INSERT INTO channel_members (
      channel_id,
      member_id
    ) VALUES (
      v_channel_id,
      v_user_id
    );
    
    -- Add owner as member
    INSERT INTO channel_members (
      channel_id,
      member_id
    ) VALUES (
      v_channel_id,
      p_owner_id
    );
    
    -- Create initial system message
    INSERT INTO messages (
      channel_id,
      sender_id,
      content
    ) VALUES (
      v_channel_id,
      v_user_id,
      'Chat started about ' || v_resource_name
    );
  END IF;
  
  RETURN v_channel_id;
END;
$$;

-- Create function to fetch channel messages
CREATE OR REPLACE FUNCTION fetch_channel_messages(
  p_channel_id uuid,
  p_limit integer DEFAULT 50,
  p_before_timestamp timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  channel_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  sender_name text,
  sender_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is a member of the channel
  IF NOT EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_id = p_channel_id
    AND member_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this channel';
  END IF;
  
  -- Return messages with sender information
  RETURN QUERY
  SELECT 
    m.id,
    m.channel_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.dealer_name AS sender_name,
    p.email AS sender_email
  FROM messages m
  JOIN profiles p ON m.sender_id = p.id
  WHERE m.channel_id = p_channel_id
  AND (p_before_timestamp IS NULL OR m.created_at < p_before_timestamp)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create function to mark channel as read
CREATE OR REPLACE FUNCTION mark_channel_as_read(
  p_channel_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Update last_read_at for the user in this channel
  UPDATE channel_members
  SET last_read_at = now()
  WHERE channel_id = p_channel_id
  AND member_id = v_user_id;
  
  -- Mark notifications as read
  UPDATE chat_notifications
  SET read = true
  WHERE channel_id = p_channel_id
  AND user_id = v_user_id
  AND read = false;
  
  RETURN FOUND;
END;
$$;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS TABLE (
  channel_id uuid,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    cm.channel_id,
    COUNT(m.id)::bigint AS unread_count
  FROM channel_members cm
  JOIN messages m ON cm.channel_id = m.channel_id
  WHERE cm.member_id = v_user_id
  AND m.created_at > cm.last_read_at
  AND m.sender_id != v_user_id
  GROUP BY cm.channel_id;
END;
$$;

-- Create function to get user channels
CREATE OR REPLACE FUNCTION get_user_channels()
RETURNS TABLE (
  id uuid,
  name text,
  is_group boolean,
  created_by uuid,
  created_at timestamptz,
  resource_type text,
  resource_id uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  other_member_id uuid,
  other_member_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  WITH last_messages AS (
    SELECT DISTINCT ON (channel_id)
      channel_id,
      content AS last_message,
      created_at AS last_message_at
    FROM messages
    ORDER BY channel_id, created_at DESC
  ),
  unread_counts AS (
    SELECT 
      cm.channel_id,
      COUNT(m.id)::bigint AS unread_count
    FROM channel_members cm
    JOIN messages m ON cm.channel_id = m.channel_id
    WHERE cm.member_id = v_user_id
    AND m.created_at > cm.last_read_at
    AND m.sender_id != v_user_id
    GROUP BY cm.channel_id
  ),
  other_members AS (
    SELECT 
      cm.channel_id,
      cm.member_id AS other_member_id,
      p.dealer_name AS other_member_name
    FROM channel_members cm
    JOIN profiles p ON cm.member_id = p.id
    WHERE cm.channel_id IN (
      SELECT channel_id FROM channel_members WHERE member_id = v_user_id
    )
    AND cm.member_id != v_user_id
  )
  SELECT 
    c.id,
    c.name,
    c.is_group,
    c.created_by,
    c.created_at,
    c.resource_type,
    c.resource_id,
    lm.last_message,
    lm.last_message_at,
    COALESCE(uc.unread_count, 0) AS unread_count,
    om.other_member_id,
    om.other_member_name
  FROM channels c
  JOIN channel_members cm ON c.id = cm.channel_id
  LEFT JOIN last_messages lm ON c.id = lm.channel_id
  LEFT JOIN unread_counts uc ON c.id = uc.channel_id
  LEFT JOIN other_members om ON c.id = om.channel_id
  WHERE cm.member_id = v_user_id
  ORDER BY lm.last_message_at DESC NULLS LAST;
END;
$$;