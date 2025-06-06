import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatNotificationStore } from '../stores/useChatNotificationStore';
import { useAuth } from '../lib/AuthProvider';

interface ChatNotificationBadgeProps {
  className?: string;
}

export default function ChatNotificationBadge({ className = '' }: ChatNotificationBadgeProps) {
  const { user } = useAuth();
  const { 
    unreadCount, 
    fetchUnreadCount, 
    subscribeToNotifications, 
    unsubscribeFromNotifications 
  } = useChatNotificationStore();

  // Set up subscription to notifications
  useEffect(() => {
    if (user?.id) {
      // Fetch initial unread count
      fetchUnreadCount();
      
      // Subscribe to new notifications
      subscribeToNotifications(user.id);
      
      // Clean up subscription on unmount
      return () => {
        unsubscribeFromNotifications();
      };
    }
  }, [user?.id]);

  return (
    <div className={`relative ${className}`}>
      <MessageSquare className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}