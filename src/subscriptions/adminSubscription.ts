import { supabase } from '../lib/supabase';
import { NetworkStatus } from '../lib/network';
import type { AppUser, Invitation } from '../types/admin';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to user changes
 * @param onUserChange Callback function to handle user changes
 * @returns The Supabase channel subscription
 */
export function subscribeToUserChanges(
  onUserChange: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', user: AppUser) => void
): RealtimeChannel {
  // Create a new channel subscription
  const channel = supabase
    .channel('admin-users')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      async (payload) => {
        try {
          console.log('Received user change:', payload.eventType, payload.new?.id);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            onUserChange(payload.eventType as 'INSERT' | 'UPDATE', payload.new as AppUser);
          } else if (payload.eventType === 'DELETE') {
            onUserChange('DELETE', payload.old as AppUser);
          }
        } catch (err) {
          console.error('Error in user changes subscription handler:', err);
        }
      }
    );
    
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log('User subscription status:', status);
  });

  // Register the channel with NetworkStatus for proper cleanup
  if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
    NetworkStatus.registerChannel(channel);
  }

  return channel;
}

/**
 * Subscribe to invitation changes
 * @param onInviteChange Callback function to handle invitation changes
 * @returns The Supabase channel subscription
 */
export function subscribeToInvitationChanges(
  onInviteChange: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', invite: Invitation) => void
): RealtimeChannel {
  // Create a new channel subscription
  const channel = supabase
    .channel('admin-invitations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invitations'
      },
      async (payload) => {
        try {
          console.log('Received invitation change:', payload.eventType, payload.new?.id);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            onInviteChange(payload.eventType as 'INSERT' | 'UPDATE', payload.new as Invitation);
          } else if (payload.eventType === 'DELETE') {
            onInviteChange('DELETE', payload.old as Invitation);
          }
        } catch (err) {
          console.error('Error in invitation changes subscription handler:', err);
        }
      }
    );
    
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log('Invitation subscription status:', status);
  });

  // Register the channel with NetworkStatus for proper cleanup
  if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
    NetworkStatus.registerChannel(channel);
  }

  return channel;
}

/**
 * Unsubscribe from a channel
 * @param channel The channel to unsubscribe from
 */
export function unsubscribeFromAdmin(channel: RealtimeChannel): void {
  if (channel) {
    if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.removeChannel === 'function') {
      NetworkStatus.removeChannel(channel);
    } else {
      supabase.removeChannel(channel);
    }
  }
}