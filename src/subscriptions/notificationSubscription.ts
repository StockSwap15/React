import { supabase } from '../lib/supabase';
import { NetworkStatus } from '../lib/network';
import type { Notification } from '../types/notification';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to new notifications
 * @param userId The user ID to subscribe to notifications for
 * @param onNotification Callback function to handle new notifications
 * @returns The Supabase channel subscription
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  console.log('Setting up notifications subscription for user:', userId);
  
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        try {
          console.log('New notification received:', payload.new.id);
          onNotification(payload.new as Notification);
        } catch (err) {
          console.error('Error in notifications subscription handler:', err);
        }
      }
    );
    
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log('Notifications subscription status:', status);
  });

  // Register the channel with NetworkStatus for proper cleanup
  if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
    NetworkStatus.registerChannel(channel);
  }
  
  return channel;
}

/**
 * Unsubscribe from notifications
 * @param channel The channel to unsubscribe from
 */
export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  if (channel) {
    console.log('Unsubscribing from notifications');
    if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.removeChannel === 'function') {
      NetworkStatus.removeChannel(channel);
    } else {
      supabase.removeChannel(channel);
    }
  }
}