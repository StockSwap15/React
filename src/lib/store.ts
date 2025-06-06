// This file is deprecated. Use src/stores/useAuthStore.ts instead.
// This file is kept for backward compatibility and will be removed in a future update.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { showError, showSuccess } from './toast';
import { withTimeout, retryWithBackoff } from './errors';
import { supabase } from './supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  lastRefresh: number;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  refetch: () => Promise<void>;
}

// Initialize the store with a default state
const initialState: Partial<AuthState> = {
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  lastRefresh: 0
};

// Define the store logic
const createStore = (set: any, get: any): AuthState => {
  // Create methods that reference the store
  const storeActions = {
    setUser: (user: User | null) => set((state: AuthState) => ({ 
      ...state,
      user,
      loading: false
    })),
    setProfile: (profile: Profile | null) => set((state: AuthState) => ({ 
      ...state,
      profile,
      isAdmin: profile?.role === 'admin',
      loading: false
    })),
    setLoading: (loading: boolean) => set({ loading }),
    reset: () => set({
      ...initialState,
      loading: false
    }),
    refetch: async () => {
      try {
        const now = Date.now();
        const lastRefresh = get().lastRefresh;
        
        // Throttle refetch to once per minute
        if (now - lastRefresh < 60000) {
          console.log('Skipping refetch, last refresh was less than 60 seconds ago');
          return;
        }

        // Check if there's an active session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          storeActions.reset();
          return;
        }

        if (!session) {
          console.log('No active session found');
          storeActions.reset();
          return;
        }
        
        set({ lastRefresh: now });
        console.log('Refreshing auth state...');
        
        // Get current user with retry and timeout
        const { data: { user }, error: userError } = await retryWithBackoff(
          async () => withTimeout(
            supabase.auth.getUser(),
            90000,
            'Auth refresh timed out'
          ),
          5
        );
        
        if (userError) {
          console.error('Error fetching user:', userError);
          storeActions.reset();
          return;
        }

        if (!user) {
          console.log('No user found');
          storeActions.reset();
          return;
        }

        console.log('User found, fetching profile...');
        // Get profile with retry and timeout
        const { data: profile, error: profileError } = await retryWithBackoff(
          async () => withTimeout(
            supabase
              .from('profiles')
              .select('id, email, role, dealer_name, phone, address, brands, alternate_phone, fax, website, business_hours, dealer_logo_url')
              .eq('id', user.id)
              .single(),
            90000,
            'Profile refresh timed out'
          ),
          5
        );

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Don't reset here as we still have a valid user
          storeActions.setUser(user);
          return;
        }

        storeActions.setUser(user);
        storeActions.setProfile(profile);
        
        showSuccess('Session refreshed successfully');
      } catch (err) {
        console.error('Error during refetch:', err);
        storeActions.reset();
        showError('Failed to refresh session');
      }
    }
  };

  return {
    ...initialState,
    ...storeActions
  } as AuthState;
};

// Create the store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    createStore,
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAdmin: state.isAdmin,
        lastRefresh: state.lastRefresh
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.refetch();
        }
      }
    }
  )
);

// Export a warning message for anyone importing this file
console.warn('Warning: src/lib/store.ts is deprecated. Use src/stores/useAuthStore.ts instead.');