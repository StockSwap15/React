import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Trash2, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { useNotifications } from '../hooks/useNotifications';
import { LoadingSpinner } from '../components/LoadingSpinner';
import NotFoundPage from './NotFoundPage';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Validate user is authenticated
  if (!user || !user.id) {
    return <NotFoundPage />;
  }
  
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError
  } = useNotifications(user.id, {
    fetchOnMount: true,
    subscribeToChanges: true
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'message':
        return <div className="p-2 bg-blue-100 rounded-full"><Bell className="h-5 w-5 text-blue-600" /></div>;
      case 'listing':
        return <div className="p-2 bg-green-100 rounded-full"><Bell className="h-5 w-5 text-green-600" /></div>;
      default:
        return <div className="p-2 bg-gray-100 rounded-full"><Bell className="h-5 w-5 text-gray-600" /></div>;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification || !notification.id) {
      console.error('Invalid notification');
      return;
    }
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => markAllAsRead()}
              disabled={loading || notifications.every(n => n.read)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button onClick={clearError}>
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {loading && notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <LoadingSpinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400">We'll notify you when something important happens</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {notifications.map(notification => {
              if (!notification || !notification.id) {
                return null;
              }
              
              return (
                <li 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-grow cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                      <div className="flex justify-between">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'text-blue-800' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                        {notification.body}
                      </p>
                      {notification.action_url && (
                        <div className="mt-2">
                          <span className="text-xs text-blue-600 hover:text-blue-800">
                            View details
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}