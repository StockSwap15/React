import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Clock } from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';
import { useChatNotificationStore } from '../stores/useChatNotificationStore';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import NotFoundPage from './NotFoundPage';

export default function ChatPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    activeChannel,
    messages,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendMessage,
    fetchHistory,
    hasMore
  } = useChatStore();
  
  const { clearChannelNotifications } = useChatNotificationStore();
  
  // Validate user is authenticated and channelId is provided
  if (!user || !channelId) {
    return <NotFoundPage />;
  }
  
  // Subscribe to the channel on mount
  useEffect(() => {
    if (channelId) {
      subscribe(channelId);
      
      // Clear notifications for this channel
      clearChannelNotifications(channelId);
    }
    
    // Unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [channelId]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus the message input when the component mounts
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);
  
  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Handle loading more messages
  const handleLoadMore = async () => {
    if (!hasMore || loading || messages.length === 0) return;
    
    const oldestMessage = messages[messages.length - 1];
    await fetchHistory(oldestMessage.created_at);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
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
  
  // Get resource info from location state
  const resourceType = location.state?.resourceType;
  const resourceId = location.state?.resourceId;
  
  // Determine back link based on resource type
  const getBackLink = () => {
    if (resourceType === 'listing') {
      return `/inventory/${resourceId}`;
    } else if (resourceType === 'iso') {
      return `/iso/${resourceId}`;
    } else {
      return '/chat';
    }
  };
  
  if (loading && !activeChannel) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={getBackLink()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">
            {activeChannel?.other_member_name || 'Chat'}
          </h1>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
        <div ref={messagesEndRef} />
        
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-4 max-w-[80%] ${msg.sender_id === user.id ? 'ml-auto' : 'mr-auto'}`}
              >
                <div className={`rounded-lg p-3 ${
                  msg.sender_id === user.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                  msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                }`}>
                  {msg.sender_id !== user.id && (
                    <>
                      <User className="h-3 w-3" />
                      <span>{msg.sender_name || 'Unknown'}</span>
                      <span>•</span>
                    </>
                  )}
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(msg.created_at)}</span>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="flex justify-center my-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Message Input */}
      <div className="bg-white p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}