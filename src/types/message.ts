interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
}

interface Channel {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  resource_type?: string;
  resource_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_member_id?: string;
  other_member_name?: string;
}

interface ChannelMember {
  channel_id: string;
  member_id: string;
  last_read_at: string;
}

export interface ChatNotification {
  id: string;
  user_id: string;
  channel_id: string;
  message_id?: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}