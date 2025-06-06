import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { 
  fetchNotifications, 
  fetchUnreadCount,
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notificationService';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../subscriptions/notificationSubscription';
import { showError } from '../utils/toast';
import type { Notification } from '../types/notification';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { withTimeout, retryWithBackoff } from '../utils/errors';

interface UseNotificationsOptions {
  fetchOnMount?: boolean;
  subscribeToChanges?: boolean;
}

export function useNotifications(userId?: string, options: UseNotificationsOptions = {}) {
  const { 
    fetchOnMount = true, 
    subscribeToChanges = true 
  } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMounted = useRef(true);
  
  const { 
    notifications, 
    unreadCount,
    setNotifications,
    setUnreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearError: clearStoreError
  } = useNotificationStore();

  // Set up subscription to notification changes
  useEffect(() => {
    if (!userId || !subscribeToChanges) return;
    
    // Subscribe to notification changes
    channelRef.current = subscribeToNotifications(userId, (notification) => {
      if (isMounted.current) {
        addNotification(notification);
      
        // Play sound or show browser notification if needed
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/icon192.png'
          });
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        unsubscribeFromNotifications(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, subscribeToChanges, addNotification]);

  // Load notifications on mount
  useEffect(() => {
    if (fetchOnMount && userId) {
      loadNotifications();
      loadUnreadCount();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [userId, fetchOnMount]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return [];
    
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const notifications = await retryWithBackoff(
        async () => withTimeout(
          fetchNotifications(),
          60000, // Increased timeout
          'Notifications fetch timed out'
        ),
        3
      );
      
      if (isMounted.current) {
        setNotifications(notifications);
      }
      
      return notifications;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, setNotifications, clearStoreError]);

  const loadUnreadCount = useCallback(async () => {
    if (!userId) return 0;
    
    try {
      const count = await retryWithBackoff(
        async () => withTimeout(
          fetchUnreadCount(),
          60000, // Increased timeout
          'Unread count fetch timed out'
        ),
        3
      );
      
      if (isMounted.current) {
        setUnreadCount(count);
      }
      
      return count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return 0;
    }
  }, [userId, setUnreadCount]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!userId || !notificationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      markAsRead(notificationId);
      
      await retryWithBackoff(
        async () => withTimeout(
          markNotificationAsRead(notificationId),
          60000, // Increased timeout
          'Mark as read timed out'
        ),
        3
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadNotifications();
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, markAsRead, loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      markAllAsRead();
      
      await retryWithBackoff(
        async () => withTimeout(
          markAllNotificationsAsRead(),
          60000, // Increased timeout
          'Mark all as read timed out'
        ),
        3
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadNotifications();
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, markAllAsRead, loadNotifications]);

  const handleDelete = useCallback(async (notificationId: string) => {
    if (!userId || !notificationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Optimistic update
      removeNotification(notificationId);
      
      await retryWithBackoff(
        async () => withTimeout(
          deleteNotification(notificationId),
          60000, // Increased timeout
          'Delete notification timed out'
        ),
        3
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadNotifications();
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, removeNotification, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    clearError: () => {
      setError(null);
      clearStoreError();
    }
  };
}