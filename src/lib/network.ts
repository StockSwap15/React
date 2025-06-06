import React, { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { showError, showInfo } from './toast';
import { withTimeout, retryWithBackoff } from './errors';

interface NetworkStatusState {
  online: boolean;
  listeners: Set<(online: boolean) => void>;
  activeChannels: Set<ReturnType<typeof supabase.channel>>;
  subscribe: (listener: (online: boolean) => void) => () => void;
  notify: () => void;
  init: () => void;
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
  registerChannel: (channel: ReturnType<typeof supabase.channel>) => void;
  removeChannel: (channel: ReturnType<typeof supabase.channel>) => void;
  cleanupAllChannels: () => void;
}

// Network status handling with error boundaries
export const NetworkStatus: NetworkStatusState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  listeners: new Set<(online: boolean) => void>(),
  activeChannels: new Set<ReturnType<typeof supabase.channel>>(),

  subscribe(listener: (online: boolean) => void) {
    try {
      this.listeners.add(listener);
      return () => {
        try {
          this.listeners.delete(listener);
        } catch (error) {
          console.error('Error removing network listener:', error);
        }
      };
    } catch (error) {
      console.error('Error adding network listener:', error);
      return () => {};
    }
  },

  notify() {
    try {
      this.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.listeners.forEach(listener => {
        try {
          listener(this.online);
        } catch (error) {
          console.error('Error notifying network listener:', error);
          this.listeners.delete(listener);
        }
      });
    } catch (error) {
      console.error('Error in network notification:', error);
    }
  },

  init() {
    if (typeof window === 'undefined') return;
    
    try {
      window.addEventListener('online', () => {
        this.online = true;
        this.notify();
        this.reconnect().catch(console.error);
      });
      
      window.addEventListener('offline', () => {
        this.online = false;
        this.notify();
      });
      
      // Periodically check connection status
      setInterval(() => {
        this.checkConnection().catch(error => {
          console.error('Connection check failed:', error);
        });
      }, 30000); // Check every 30 seconds
      
      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkConnection().then(online => {
            if (online) {
              this.reconnect().catch(console.error);
            }
          }).catch(console.error);
        }
      });
      
      // Handle before unload to clean up channels
      window.addEventListener('beforeunload', () => {
        this.cleanupAllChannels();
      });
    } catch (error) {
      console.error('Error initializing network status:', error);
    }
  },
  
  registerChannel(channel) {
    this.activeChannels.add(channel);
    console.log(`Channel registered, total active: ${this.activeChannels.size}`);
  },
  
  removeChannel(channel) {
    if (this.activeChannels.has(channel)) {
      supabase.removeChannel(channel);
      this.activeChannels.delete(channel);
      console.log(`Channel removed, total active: ${this.activeChannels.size}`);
    }
  },
  
  cleanupAllChannels() {
    console.log(`Cleaning up all channels (${this.activeChannels.size})`);
    this.activeChannels.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error('Error removing channel:', err);
      }
    });
    this.activeChannels.clear();
  },
  
  async checkConnection() {
    if (typeof window === 'undefined') return true;
    
    try {
      // Try to fetch a small resource to verify connection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased from 5000ms to 10000ms
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const online = response.ok;
      if (online !== this.online) {
        this.online = online;
        this.notify();
      }
      
      return online;
    } catch (error) {
      // If fetch fails, we're offline
      if (this.online) {
        this.online = false;
        this.notify();
      }
      return false;
    }
  },
  
  async reconnect() {
    if (!this.online) return false;
    
    try {
      if (typeof showInfo === 'function') {
        showInfo('Reconnecting to server...');
      }
      
      // Refresh auth session with retry and timeout
      const { error: authError } = await retryWithBackoff(
        async () => withTimeout(
          supabase.auth.refreshSession(),
          90000, // Increased timeout
          'Auth refresh timed out'
        ),
        3
      );
      
      if (authError) {
        console.error('Auth refresh failed:', authError);
        if (typeof showError === 'function') {
          showError('Failed to refresh authentication. Please reload the page.');
        }
        return false;
      }
      
      // Test connection with a simple query
      const { error: queryError } = await retryWithBackoff(
        async () => withTimeout(
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          90000, // Increased timeout
          'Database connection test timed out'
        ),
        3
      );
        
      if (queryError) {
        console.error('Connection test failed:', queryError);
        if (typeof showError === 'function') {
          showError('Connection restored but database access failed. Please reload the page.');
        }
        return false;
      }
      
      // Reconnect all active channels
      if (this.activeChannels.size > 0) {
        console.log(`Reconnecting ${this.activeChannels.size} active channels`);
        this.cleanupAllChannels();
        
        if (typeof showInfo === 'function') {
          showInfo('Reconnecting to real-time updates...');
        }
      }
      
      if (typeof showInfo === 'function') {
        showInfo('Connection restored successfully');
      }
      return true;
    } catch (error) {
      console.error('Reconnection failed:', error);
      if (typeof showError === 'function') {
        showError('Failed to reconnect. Please reload the page.');
      }
      return false;
    }
  }
};

// Initialize if in browser environment
if (typeof window !== 'undefined') {
  NetworkStatus.init();
}

// Hook for components to use with error handling
function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(() => {
    try {
      return NetworkStatus.online;
    } catch (error) {
      console.error('Error getting initial network status:', error);
      return true;
    }
  });
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    try {
      const unsubscribe = NetworkStatus.subscribe((online) => {
        if (isMounted.current) {
          setIsOnline(online);
        }
      });
      
      return () => {
        isMounted.current = false;
        unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to network status:', error);
      return () => {};
    }
  }, []);

  return isOnline;
}

// Hook to register and clean up a channel
function useChannel(channel: ReturnType<typeof supabase.channel> | null) {
  const channelRef = useRef(channel);
  
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);
  
  useEffect(() => {
    if (channelRef.current) {
      NetworkStatus.registerChannel(channelRef.current);
      
      return () => {
        if (channelRef.current) {
          NetworkStatus.removeChannel(channelRef.current);
        }
      };
    }
  }, []);
}