import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousOnlineState = React.useRef(isOnline);
  const { refetch } = useAuthStore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShow(true);
      previousOnlineState.current = true;
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
      previousOnlineState.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Only show notification when state changes
    if (previousOnlineState.current !== isOnline) {
      setShow(true);
      previousOnlineState.current = isOnline;
      
      // Hide notification after delay if online
      if (isOnline) {
        const timer = setTimeout(() => setShow(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  // Auto-refresh when coming back online
  useEffect(() => {
    if (isOnline && previousOnlineState.current === false) {
      handleRefresh();
    }
  }, [isOnline]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      // Refresh auth session
      await refetch();
      
      // Ping Supabase to check connection
      await supabase.from('profiles').select('*', { count: 'exact' }).limit(1);
      
      // If we get here, the connection is working
      setShow(false);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Don't render anything if not showing
  if (!show) return null;

  return (
    <ErrorBoundary 
      boundary="network status" 
      fallback={null} // Don't show anything if the component fails
    >
      <div 
        className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 z-50"
        aria-live={isOnline ? "polite" : "assertive"}
        role="status"
      >
        <div className={`flex items-center gap-2 ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-600'
        } p-3 rounded-lg`}>
          {isOnline ? (
            <Wifi className="h-5 w-5" aria-hidden="true" />
          ) : (
            <WifiOff className="h-5 w-5" aria-hidden="true" />
          )}
          <span>
            {isOnline ? 'Back online' : 'No internet connection'}
          </span>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className={`ml-2 text-xs ${isOnline ? 'text-green-800 hover:text-green-900' : 'text-red-700 hover:text-red-800'} underline flex items-center gap-1`}
            aria-label={isRefreshing ? 'Refreshing connection' : 'Refresh connection'}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}