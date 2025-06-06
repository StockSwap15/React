/*
  # Fix ambiguous created_at column

  1. Changes
    - Drop and recreate get_user_channels function with explicit table references
    - Ensure proper ordering by channels.created_at
    
  2. Security
    - Maintain existing security context
    - Keep function as SECURITY DEFINER
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_channels;

-- Recreate the function with explicit table references
CREATE OR REPLACE FUNCTION get_user_channels()
RETURNS TABLE (
  id uuid,
  name text,
  is_group boolean,
  created_by uuid,
  created_at timestamptz,
  resource_type text,
  resource_id uuid,
  last_message json,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.is_group,
    c.created_by,
    c.created_at,
    c.resource_type,
    c.resource_id,
    (
      SELECT json_build_object(
        'id', m.id,
        'content', m.content,
        'sender_id', m.sender_id,
        'created_at', m.created_at
      )
      FROM messages m
      WHERE m.channel_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) as last_message,
    (
      SELECT COUNT(*)
      FROM messages m
      JOIN channel_members cm ON cm.channel_id = m.channel_id
      WHERE m.channel_id = c.id
      AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
      AND cm.member_id = auth.uid()
      AND m.sender_id != auth.uid()
    ) as unread_count
  FROM channels c
  JOIN channel_members cm ON cm.channel_id = c.id
  WHERE cm.member_id = auth.uid()
  ORDER BY (
    SELECT MAX(m.created_at)
    FROM messages m
    WHERE m.channel_id = c.id
  ) DESC NULLS LAST,
  c.created_at DESC;
END;
$$;