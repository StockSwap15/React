export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  type?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationCount {
  count: number;
}