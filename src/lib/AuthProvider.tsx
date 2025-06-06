import React, { useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { withTimeout, retryWithBackoff } from './errors';
import { showError, showInfo } from './toast';

async function getProfile(userId: string, retries = 5, delay = 2000) {
  return retryWithBackoff(
    async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, email, role, dealer_name, phone, address, brands, alternate_phone, fax, website, business_hours, dealer_logo_url')
          .eq('id', userId)
          .single(),
        120000, // Increased from 60000ms to 120000ms
        'Profile fetch timed out'
      );

      if (error) throw error;
      return data;
    },
    retries,
    delay
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, loading, refetch } = useAuthStore();

  // Set up network status listeners for session recovery
  useEffect(() => {
    const handleOnline = async () => {
      try {
        console.log('Network connection restored, refreshing auth state...');
        await refetch();
      } catch (err) {
        console.error('Error refreshing auth state:', err);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    
    // Set up inactivity detection
    let inactivityTimeout: number | null = null;
    let lastActivity = Date.now();
    
    const resetInactivityTimer = () => {
      lastActivity = Date.now();
      
      if (inactivityTimeout) {
        window.clearTimeout(inactivityTimeout);
      }
      
      inactivityTimeout = window.setTimeout(() => {
        // If inactive for 25 minutes, show warning
        if (Date.now() - lastActivity > 25 * 60 * 1000) {
          showInfo('You have been inactive for a while. Consider refreshing the page to maintain your session.');
        }
      }, 25 * 60 * 1000); // 25 minutes
    };
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });
    
    // Initial timer
    resetInactivityTimer();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      
      // Clean up activity tracking
      if (inactivityTimeout) {
        window.clearTimeout(inactivityTimeout);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [refetch]);

  const initializeAuth = useCallback(async () => {
    if (!setUser || !setProfile || !setLoading) {
      console.error('Auth store functions not available');
      return;
    }

    try {
      setLoading(true);

      // Use retryWithBackoff for the initial session fetch to handle potential network issues
      const { data: { session }, error: sessionError } = await retryWithBackoff(
        async () => withTimeout(
          supabase.auth.getSession(),
          120000, // Increased from 60000ms to 120000ms
          'Session fetch timed out'
        ),
        3, // Try up to 3 times
        5000 // Start with a 5 second delay between retries
      );
      
      if (sessionError) throw sessionError;

      // Handle no session case
      if (!session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Handle valid session
      if (session?.user) {
        setUser(session.user);
        try {
          // Use a shorter timeout for profile fetch since we already have the session
          const profile = await getProfile(session.user.id, 3, 3000);
          setProfile(profile);
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          // Continue with just the user info
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      setProfile(null);
      showError('Failed to initialize authentication. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [setUser, setProfile, setLoading]);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function authStateListener(event: string, session: any) {
      if (!mounted) return;

      console.log('Auth state change event:', event);

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          try {
            const profile = await getProfile(session.user.id, 3, 3000);
            if (mounted) {
              setProfile(profile);
            }
          } catch (profileError) {
            console.error('Error fetching profile after token refresh:', profileError);
          }
        }
        return;
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        return;
      }

      // Handle session changes
      if (session?.user) {
        setUser(session.user);
        try {
          const profile = await getProfile(session.user.id, 3, 3000);
          if (mounted) {
            setProfile(profile);
          }
        } catch (profileError) {
          console.error('Error fetching profile after auth state change:', profileError);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    }

    // Initialize auth with retry logic
    const initAuth = async () => {
      try {
        await initializeAuth();
        
        // Set up auth subscription only if mounted
        if (mounted) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(authStateListener);
          authSubscription = subscription;
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          showError('Failed to initialize authentication. Please refresh the page.');
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [setUser, setProfile, setLoading, initializeAuth]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

export function useAuth() {
  const store = useAuthStore();
  return useMemo(() => ({
    user: store.user,
    profile: store.profile,
    loading: store.loading,
    isAdmin: store.isAdmin
  }), [store.user, store.profile, store.loading, store.isAdmin]);
}