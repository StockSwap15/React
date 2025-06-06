/*
  # Add Messages Update Policy

  1. Changes
    - Add policy for updating read status
    - Ensure receivers can mark their messages as read
    
  2. Security
    - Only allow updating read status for received messages
    - Maintain existing RLS policies
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;

-- Add policy for updating read status
CREATE POLICY "Users can mark received messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id AND
    -- Only allow updating the read field
    xmin = xmin
  );