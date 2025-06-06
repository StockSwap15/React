import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { showError } from '../utils/toast';
import type { ChatNotification } from '../types/message';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NetworkStatus } from '../lib/network';

interface ChatNotificationState {
  // State
  notifications: ChatNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  subscription: RealtimeChannel | null;
  
  // Actions
  setNotifications: (notifications: ChatNotification[]) => void;
  addNotification: (notification: ChatNotification) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSubscription: (subscription: RealtimeChannel | null) => void;
  
  // Operations
  fetchNotifications: () => Promise<ChatNotification[]>;
  fetchUnreadCount: () => Promise<number>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearChannelNotifications: (channelId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  clearError: () => void;
}

export const useChatNotificationStore = create<ChatNotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  subscription: null,
  
  // State setters
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  addNotification: (notification) => set(state => {
    // Check if notification already exists
    if (state.notifications.some(n => n.id === notification.id)) {
      return state;
    }
    
    const newNotifications = [notification, ...state.notifications];
    return {
      notifications: newNotifications,
      unreadCount: state.unreadCount + (notification.read ? 0 : 1)
    };
  }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSubscription: (subscription) => set({ subscription }),
  
  // Fetch all notifications for the current user
  fetchNotifications: async () => {
    const { setLoading, setError, setNotifications } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNotifications(data || []);
      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(message);
      showError(message);
      return [];
    } finally {
      setLoading(false);
    }
  },
  
  // Fetch unread notification count
  fetchUnreadCount: async () => {
    const { setLoading, setError, setUnreadCount } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { count, error } = await supabase
        .from('chat_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      
      if (error) throw error;
      
      setUnreadCount(count || 0);
      return count || 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(message);
      console.error(message);
      return 0;
    } finally {
      setLoading(false);
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const { setLoading, setError, notifications, setNotifications } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('chat_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    const { setLoading, setError, setNotifications, notifications } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('chat_notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      setNotifications(updatedNotifications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  },
  
  // Clear notifications for a specific channel
  clearChannelNotifications: async (channelId) => {
    const { setLoading, setError, notifications, setNotifications } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('chat_notifications')
        .update({ read: true })
        .eq('channel_id', channelId)
        .eq('read', false);
      
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.map(notification => 
        notification.channel_id === channelId
          ? { ...notification, read: true }
          : notification
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear channel notifications';
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  },
  
  // Delete a notification
  deleteNotification: async (notificationId) => {
    const { setLoading, setError, notifications, setNotifications } = get();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('chat_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      setNotifications(updatedNotifications);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  },
  
  // Subscribe to new notifications
  subscribeToNotifications: (userId) => {
    const { unsubscribeFromNotifications, setSubscription, addNotification } = get();
    
    // First unsubscribe from any existing subscription
    unsubscribeFromNotifications();
    
    // Create a new subscription
    const channel = supabase
      .channel(`chat-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Add the new notification to state
          addNotification(payload.new as ChatNotification);
          
          // Play sound or show browser notification if needed
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.body,
              icon: '/icon192.png'
            });
          }
        }
      )
      .subscribe();
    
    // Register the channel with NetworkStatus for proper cleanup
    if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
      NetworkStatus.registerChannel(channel);
    }
    
    setSubscription(channel);
  },
  
  // Unsubscribe from notifications
  unsubscribeFromNotifications: () => {
    const { subscription, setSubscription } = get();
    
    if (subscription) {
      if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.removeChannel === 'function') {
        NetworkStatus.removeChannel(subscription);
      } else {
        supabase.removeChannel(subscription);
      }
      
      setSubscription(null);
    }
  },
  
  // Clear error
  clearError: () => set({ error: null })
}));