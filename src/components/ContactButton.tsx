import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';
import { useAuth } from '../lib/AuthProvider';

interface ContactButtonProps {
  resourceType: 'listing' | 'iso';
  resourceId: string;
  ownerId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  label?: string;
}

export default function ContactButton({
  resourceType,
  resourceId,
  ownerId,
  className = '',
  variant = 'primary',
  size = 'md',
  showIcon = true,
  label = 'Contact'
}: ContactButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrCreateResourceChannel, loading } = useChatStore();

  // Determine button styles based on variant and size
  const getButtonStyles = () => {
    // Base styles
    let styles = 'flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ';
    
    // Size styles
    switch (size) {
      case 'sm':
        styles += 'px-3 py-1.5 text-sm ';
        break;
      case 'lg':
        styles += 'px-6 py-3 text-lg ';
        break;
      default: // md
        styles += 'px-4 py-2 ';
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        styles += 'bg-gray-600 text-white hover:bg-gray-700 ';
        break;
      case 'outline':
        styles += 'border border-blue-600 text-blue-600 hover:bg-blue-50 ';
        break;
      default: // primary
        styles += 'bg-blue-600 text-white hover:bg-blue-700 ';
        break;
    }
    
    // Add disabled styles
    styles += 'disabled:opacity-50 disabled:cursor-not-allowed ';
    
    // Add custom className
    styles += className;
    
    return styles;
  };

  const handleClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      // Don't allow contacting yourself
      if (ownerId === user.id) {
        throw new Error("You can't contact yourself");
      }

      // Get or create a channel for this resource
      const channel = await getOrCreateResourceChannel({
        type: resourceType,
        id: resourceId,
        ownerId
      });

      // Navigate to the chat page
      navigate(`/chat/${channel.id}`, {
        state: { resourceType, resourceId }
      });
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || ownerId === user?.id}
      className={getButtonStyles()}
      aria-label={label}
    >
      {showIcon && <MessageSquare className="h-5 w-5" />}
      <span>{label}</span>
    </button>
  );
}