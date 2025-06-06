import { supabase } from '../lib/supabase';
import { withTimeout, retryWithBackoff } from '../utils/errors';
import type { Notification, NotificationCount } from '../types/notification';
import { z } from 'zod';

// Define validation schema
const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  type: z.string().optional(),
  action_url: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Fetch notifications for the current user
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .select('id, user_id, title, body, read, type, action_url, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      60000, // Increased from 30000ms to 60000ms
      'Notifications fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch unread notification count for the current user
 */
export async function fetchUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
      60000, // Increased from 30000ms to 60000ms
      'Unread count fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id),
      60000, // Increased from 30000ms to 60000ms
      'Mark as read timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false),
      60000, // Increased from 30000ms to 60000ms
      'Mark all as read timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id),
      60000, // Increased from 30000ms to 60000ms
      'Delete notification timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Create a notification (admin only)
 */
async function createNotification(
  userId: string,
  title: string,
  body: string,
  type?: string,
  actionUrl?: string,
  metadata?: Record<string, any>
): Promise<Notification> {
  // Validate input data
  const validatedData = notificationSchema.parse({
    title,
    body,
    type,
    action_url: actionUrl,
    metadata
  });

  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: validatedData.title,
          body: validatedData.body,
          type: validatedData.type,
          action_url: validatedData.action_url,
          metadata: validatedData.metadata,
          read: false
        })
        .select('id, user_id, title, body, read, type, action_url, metadata, created_at')
        .single(),
      60000, // Increased from 30000ms to 60000ms
      'Create notification timed out'
    );
  }, 5);

  if (error) throw error;
  return data;
}