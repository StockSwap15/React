import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, User, Search, AlertCircle } from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import NotFoundPage from './NotFoundPage';

export default function ChatsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    channels, 
    loading, 
    error, 
    fetchChannels,
    clearError
  } = useChatStore();
  
  // Validate user is authenticated
  if (!user) {
    return <NotFoundPage />;
  }
  
  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);
  
  // Format timestamp
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Truncate message
  const truncateMessage = (message?: string, maxLength = 50) => {
    if (!message) return '';
    
    if (message.length <= maxLength) return message;
    
    return message.substring(0, maxLength) + '...';
  };
  
  if (loading && channels.length === 0) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <button 
            onClick={clearError}
            className="text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {channels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
          <p className="text-gray-500 mb-6">
            You don't have any conversations yet. Start a conversation by contacting a dealer.
          </p>
          <Link
            to="/inventory"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Inventory
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {channels.map((channel) => (
              <li 
                key={channel.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/chat/${channel.id}`)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <h3 className="font-medium">
                        {channel.other_member_name || 'Unknown'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(channel.last_message_at)}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm ml-7">
                    {truncateMessage(channel.last_message)}
                  </p>
                  {channel.unreadCount && channel.unreadCount > 0 && (
                    <div className="mt-1 flex justify-end">
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {channel.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}