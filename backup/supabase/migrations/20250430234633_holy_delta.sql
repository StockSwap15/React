-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
END
$$;

-- Create policies
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

-- Create function to send notification
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

-- Create trigger function for new messages
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
  
  -- Create notification
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

-- Create trigger for new messages
DROP TRIGGER IF EXISTS notify_on_new_message_trigger ON messages;
CREATE TRIGGER notify_on_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();

-- Create trigger function for new listings
CREATE OR REPLACE FUNCTION notify_on_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dealer_name text;
  admin_id uuid;
  admin_cursor CURSOR FOR 
    SELECT id FROM profiles WHERE role = 'admin';
BEGIN
  -- Only notify for available or searching listings
  IF NEW.status NOT IN ('available', 'searching') THEN
    RETURN NEW;
  END IF;
  
  -- Get dealer name
  SELECT profiles.dealer_name INTO dealer_name
  FROM profiles
  WHERE id = NEW.dealer_id;
  
  -- Notify each admin individually using a cursor instead of FOREACH
  OPEN admin_cursor;
  LOOP
    FETCH admin_cursor INTO admin_id;
    EXIT WHEN NOT FOUND;
    
    PERFORM send_notification(
      admin_id,
      'New Listing',
      dealer_name || ' posted a new ' || NEW.year || ' ' || NEW.make || ' ' || NEW.model,
      'listing',
      '/inventory/' || NEW.id,
      jsonb_build_object(
        'listing_id', NEW.id,
        'dealer_id', NEW.dealer_id,
        'status', NEW.status
      )
    );
  END LOOP;
  CLOSE admin_cursor;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new listings
DROP TRIGGER IF EXISTS notify_on_new_listing_trigger ON listings;
CREATE TRIGGER notify_on_new_listing_trigger
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_listing();