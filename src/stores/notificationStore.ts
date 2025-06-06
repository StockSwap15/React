import { create } from 'zustand';
import type { Notification } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // State setters
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Notification operations
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  
  // Utility
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  // State setters
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Notification operations
  addNotification: (notification) => set(state => {
    // Check if notification already exists to prevent duplicates
    if (state.notifications.some(n => n.id === notification.id)) {
      return state;
    }
    
    const newNotifications = [notification, ...state.notifications];
    return {
      notifications: newNotifications,
      unreadCount: notification.read 
        ? state.unreadCount 
        : state.unreadCount + 1
    };
  }),
  
  markAsRead: (notificationId) => set(state => {
    const updatedNotifications = state.notifications.map(notification => 
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    
    // Only decrement unread count if the notification was previously unread
    const wasUnread = state.notifications.find(n => n.id === notificationId)?.read === false;
    
    return {
      notifications: updatedNotifications,
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
    };
  }),
  
  markAllAsRead: () => set(state => ({
    notifications: state.notifications.map(notification => ({
      ...notification,
      read: true
    })),
    unreadCount: 0
  })),
  
  removeNotification: (notificationId) => set(state => {
    const notification = state.notifications.find(n => n.id === notificationId);
    const wasUnread = notification && !notification.read;
    
    return {
      notifications: state.notifications.filter(n => n.id !== notificationId),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
    };
  }),
  
  // Utility
  clearError: () => set({ error: null })
}));