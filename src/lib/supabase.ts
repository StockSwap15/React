import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { showError } from './toast';

// Get environment variables with validation
function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value as string;
}

// Get required environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Create the Supabase client instance with improved timeouts and retries
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-yxwdictklewqytcsqyjt-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'stockswap',
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeat: {
      interval: 15000,
      maxRetries: 5
    }
  }
});

// Heartbeat mechanism to keep connection alive
let heartbeatInterval: number | null = null;
let isHeartbeatActive = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function startHeartbeat() {
  if (isHeartbeatActive) return;
  
  isHeartbeatActive = true;
  reconnectAttempts = 0;
  
  // Clear any existing interval
  if (heartbeatInterval) {
    window.clearInterval(heartbeatInterval);
  }
  
  // Set up heartbeat interval (every 3 minutes)
  heartbeatInterval = window.setInterval(async () => {
    try {
      if (!navigator.onLine) return;
      
      // Simple ping query to keep connection alive
      const { error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.warn('Heartbeat query failed:', error.message);
        // Try to refresh auth if there's an auth error
        if (error.message.includes('JWT')) {
          await supabase.auth.refreshSession();
        }
        
        // Handle reconnection attempts
        if (++reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          stopHeartbeat();
          if (typeof showError === 'function') {
            showError('Connection lost. Please refresh the page.');
          } else {
            console.error('Connection lost. Please refresh the page.');
          }
        }
      } else {
        // Reset reconnect attempts on successful ping
        reconnectAttempts = 0;
      }
    } catch (err) {
      console.warn('Heartbeat error:', err);
      
      if (++reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        stopHeartbeat();
        if (typeof showError === 'function') {
          showError('Connection lost. Please refresh the page.');
        } else {
          console.error('Connection lost. Please refresh the page.');
        }
      }
    }
  }, 3 * 60 * 1000); // 3 minutes
  
  // Set up a listener for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export function stopHeartbeat() {
  isHeartbeatActive = false;
  
  if (heartbeatInterval) {
    window.clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

// Handle reconnection
async function handleOnline() {
  try {
    console.log('Network connection restored, refreshing session...');
    reconnectAttempts = 0;
    
    // Refresh auth session
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to refresh session:', error);
      if (typeof showError === 'function') {
        showError('Connection restored, but session refresh failed. Please reload the page.');
      } else {
        console.error('Connection restored, but session refresh failed. Please reload the page.');
      }
    }
  } catch (err) {
    console.error('Error handling reconnection:', err);
  }
}

// Handle disconnection
function handleOffline() {
  console.log('Network connection lost');
  if (typeof showError === 'function') {
    showError('Network connection lost. Waiting for connection to restore...');
  } else {
    console.error('Network connection lost. Waiting for connection to restore...');
  }
}

// Initialize heartbeat when this module is imported
if (typeof window !== 'undefined') {
  startHeartbeat();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    stopHeartbeat();
  });
}

type Profile = Database['public']['Tables']['profiles']['Row'];