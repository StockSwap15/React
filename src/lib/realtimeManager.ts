import { supabase } from './supabase';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useListingStore } from '../stores/listingStore';
import { showError, showInfo } from './toast';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Create a singleton for subscription state
class SubscriptionManager {
  private static instance: SubscriptionManager;
  private listingsSubscribed: boolean = false;
  private lastPingTime: number = Date.now();
  private pingInterval: number | null = null;
  private connectionCheckInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS: number = 5;

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public setListingsSubscribed(value: boolean): void {
    this.listingsSubscribed = value;
  }

  public isListingsSubscribed(): boolean {
    return this.listingsSubscribed;
  }

  public getLastPingTime(): number {
    return this.lastPingTime;
  }

  public setLastPingTime(time: number): void {
    this.lastPingTime = time;
  }

  public getPingInterval(): number | null {
    return this.pingInterval;
  }

  public setPingInterval(interval: number | null): void {
    this.pingInterval = interval;
  }

  public getConnectionCheckInterval(): number | null {
    return this.connectionCheckInterval;
  }

  public setConnectionCheckInterval(interval: number | null): void {
    this.connectionCheckInterval = interval;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public setReconnectAttempts(attempts: number): void {
    this.reconnectAttempts = attempts;
  }

  public incrementReconnectAttempts(): void {
    this.reconnectAttempts++;
  }

  public getMaxReconnectAttempts(): number {
    return this.MAX_RECONNECT_ATTEMPTS;
  }
}

// Get the subscription manager instance
const subscriptionManager = SubscriptionManager.getInstance();

// Function to check if channels are active
function checkActiveChannels(): boolean {
  const channels = supabase.getChannels();
  return channels.length > 0;
}

// Function to ping Supabase to keep connection alive
async function pingSupabase(): Promise<boolean> {
  try {
    subscriptionManager.setLastPingTime(Date.now());
    
    // Simple lightweight query to keep connection alive
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.warn('Ping failed:', error.message);
      return false;
    }
    
    subscriptionManager.setReconnectAttempts(0); // Reset counter on successful ping
    return true;
  } catch (err) {
    console.error('Error pinging Supabase:', err);
    return false;
  }
}

// Function to check and restore subscriptions
async function checkAndRestoreSubscriptions(): Promise<void> {
  try {
    // Check if we have active channels
    const hasActiveChannels = checkActiveChannels();
    
    if (!hasActiveChannels) {
      console.log('No active channels detected, attempting to restore subscriptions');
      
      if (subscriptionManager.getReconnectAttempts() >= subscriptionManager.getMaxReconnectAttempts()) {
        console.warn(`Max reconnect attempts (${subscriptionManager.getMaxReconnectAttempts()}) reached, waiting for user interaction`);
        showError('Connection lost. Please refresh the page.');
        return;
      }
      
      subscriptionManager.incrementReconnectAttempts();
      
      // Refresh auth session first
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Failed to refresh auth session:', refreshError);
        showError('Connection lost. Attempting to reconnect...');
      }
      
      // Restore subscriptions
      if (subscriptionManager.isListingsSubscribed()) {
        console.log('Restoring listings subscription');
        
        try {
          // Create a new subscription
          const channel = subscribeToListingChanges((eventType, listing) => {
            console.log(`Received listing ${eventType} event:`, listing.id);
          });
          
          // Register the channel for cleanup
          if (channel) {
            console.log('Listings subscription restored successfully');
          }
        } catch (error) {
          console.error('Error restoring listings subscription:', error);
        }
      }
      
      showInfo('Real-time connection restored');
    } else {
      // Reset counter if channels are active
      subscriptionManager.setReconnectAttempts(0);
    }
  } catch (err) {
    console.error('Error checking subscriptions:', err);
  }
}

// Start periodic ping and connection check
export function startRealtimeMonitoring(): void {
  if (subscriptionManager.getPingInterval()) {
    clearInterval(subscriptionManager.getPingInterval());
  }
  
  if (subscriptionManager.getConnectionCheckInterval()) {
    clearInterval(subscriptionManager.getConnectionCheckInterval());
  }
  
  // Ping every 2 minutes to keep connection alive
  const pingIntervalId = window.setInterval(async () => {
    if (navigator.onLine) {
      await pingSupabase();
    }
  }, 2 * 60 * 1000);
  
  subscriptionManager.setPingInterval(pingIntervalId);
  
  // Check subscriptions every 45 seconds
  const connectionCheckIntervalId = window.setInterval(() => {
    if (navigator.onLine && subscriptionManager.isListingsSubscribed()) {
      // Only check if we're supposed to have active subscriptions
      checkAndRestoreSubscriptions();
    }
  }, 45 * 1000);
  
  subscriptionManager.setConnectionCheckInterval(connectionCheckIntervalId);
}

// Stop monitoring
export function stopRealtimeMonitoring(): void {
  if (subscriptionManager.getPingInterval()) {
    clearInterval(subscriptionManager.getPingInterval());
    subscriptionManager.setPingInterval(null);
  }
  
  if (subscriptionManager.getConnectionCheckInterval()) {
    clearInterval(subscriptionManager.getConnectionCheckInterval());
    subscriptionManager.setConnectionCheckInterval(null);
  }
}

// Custom hook to manage real-time subscriptions
export function useRealtimeKeepAlive(
  options: {
    subscribeToListings?: boolean;
  } = {}
): void {
  const optionsRef = useRef(options);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Track which subscriptions should be active
  useEffect(() => {
    subscriptionManager.setListingsSubscribed(!!options.subscribeToListings);
    
    return () => {
      // Only update if this specific instance is being unmounted
      if (options.subscribeToListings) {
        subscriptionManager.setListingsSubscribed(false);
      }
    };
  }, [options.subscribeToListings]);
  
  // Set up visibility change listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, checking subscriptions');
        
        // Refresh auth session first
        try {
          await supabase.auth.refreshSession();
        } catch (err) {
          console.error('Error refreshing session on visibility change:', err);
        }
        
        // Restore subscriptions
        if (optionsRef.current.subscribeToListings) {
          try {
            // Create a new subscription
            const channel = subscribeToListingChanges((eventType, listing) => {
              console.log(`Received listing ${eventType} event:`, listing.id);
            });
            
            // Register the channel for cleanup
            if (channel) {
              console.log('Listings subscription restored successfully');
            }
          } catch (error) {
            console.error('Error restoring listings subscription:', error);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial setup
    if (options.subscribeToListings && !hasStarted) {
      setHasStarted(true);
      const initializeSubscription = async () => {
        try {
          // Create a new subscription
          const channel = subscribeToListingChanges((eventType, listing) => {
            console.log(`Received listing ${eventType} event:`, listing.id);
          });
          
          // Register the channel for cleanup
          if (channel) {
            console.log('Listings subscription initialized successfully');
          }
        } catch (error) {
          console.error('Error initializing listings subscription:', error);
        }
      };
      
      initializeSubscription();
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up subscriptions if this component is unmounted
      if (options.subscribeToListings) {
        const cleanupSubscription = async () => {
          try {
            // Get active channels
            const channels = supabase.getChannels();
            
            // Unsubscribe from each channel
            for (const channel of channels) {
              if (channel.topic.includes('listings')) {
                unsubscribeFromListings(channel);
              }
            }
          } catch (error) {
            console.error('Error cleaning up listings subscription:', error);
          }
        };
        
        cleanupSubscription();
      }
    };
  }, [
    options.subscribeToListings,
    hasStarted
  ]);
  
  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Auth state change:', event);
        
        // Re-subscribe after token refresh or sign in
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (optionsRef.current.subscribeToListings) {
            try {
              // Get active channels
              const channels = supabase.getChannels();
              
              // Unsubscribe from existing channels
              for (const channel of channels) {
                if (channel.topic.includes('listings')) {
                  unsubscribeFromListings(channel);
                }
              }
              
              // Create a new subscription
              const channel = subscribeToListingChanges((eventType, listing) => {
                console.log(`Received listing ${eventType} event:`, listing.id);
              });
              
              // Register the channel for cleanup
              if (channel) {
                console.log('Listings subscription refreshed successfully');
              }
            } catch (error) {
              console.error('Error refreshing listings subscription:', error);
            }
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Set up online/offline listener
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Network connection restored, checking subscriptions');
      await checkAndRestoreSubscriptions();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}