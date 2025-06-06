import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { useAuthStore } from './store';
import { withTimeout, retryWithBackoff } from './errors';
import { showError, showSuccess } from './toast';
import { trackError } from './analytics';

type Profile = Database['public']['Tables']['profiles']['Row'];

const profileCache = new Map<string, Profile>();

async function getProfile(userId: string) {
  try {
    const cached = profileCache.get(userId);
    if (cached) return cached;

    const result = await retryWithBackoff(async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, email, role, dealer_name, phone, address, brands')
          .eq('id', userId)
          .single(),
        15000, // 15 second timeout
        'Profile fetch timed out'
      );

      if (error) throw error;
      return data;
    }, 3, 2000); // 3 attempts, 2 second base delay
    
    if (result) {
      profileCache.set(userId, result);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching profile:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'getProfile', { userId });
    showError('Failed to fetch profile. Please try refreshing the page.');
    return null;
  }
}

export async function signOut() {
  try {
    // First clear all state and storage
    useAuthStore.getState().reset();
    profileCache.clear();
    localStorage.clear();
    sessionStorage.clear();
    
    // Then sign out from Supabase
    const { error } = await withTimeout(
      supabase.auth.signOut(),
      10000,
      'Sign out timed out'
    );
    if (error) throw error;
    
    // Finally, hard redirect
    window.location.href = '/login';
  } catch (error) {
    console.error('Error during sign out:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'signOut');
    showError('Failed to sign out properly. Please refresh the page.');
    // Ensure redirect happens even on error
    window.location.href = '/login';
  }
}

export async function signUp(email: string, password: string) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`
        }
      }),
      15000,
      'Sign up request timed out'
    );

    if (authError) throw authError;

    if (authData.user) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const userProfile = await getProfile(authData.user.id);
      if (!userProfile) {
        throw new Error('Failed to create user profile');
      }

      // Set auth state
      useAuthStore.getState().setUser(authData.user);
      useAuthStore.getState().setProfile(userProfile);

      return { ...authData, profile: userProfile };
    }

    return authData;
  } catch (error) {
    console.error('Error during sign up:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'signUp');
    
    if (error instanceof Error) {
      if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

export async function signIn(email: string, password: string) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      15000,
      'Sign in request timed out'
    );

    if (authError) {
      if (authError.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw authError;
    }

    if (authData.user) {
      const profile = await getProfile(authData.user.id);

      if (!profile) {
        const { data: newProfile, error: createError } = await withTimeout(
          supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              role: 'pending'
            })
            .select('id, email, role, dealer_name, phone, address, brands')
            .single(),
          15000,
          'Profile creation timed out'
        );

        if (createError) throw createError;

        // Set auth state
        useAuthStore.getState().setUser(authData.user);
        useAuthStore.getState().setProfile(newProfile);

        return { ...authData, profile: newProfile };
      }

      if (profile.role === 'pending') {
        await signOut();
        throw new Error('Your account is pending approval. Please wait for an administrator to approve your account.');
      }

      // Set auth state
      useAuthStore.getState().setUser(authData.user);
      useAuthStore.getState().setProfile(profile);

      return { ...authData, profile };
    }

    return authData;
  } catch (error) {
    console.error('Error during sign in:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'signIn');
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

export async function resetPassword(email: string) {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const { error } = await withTimeout(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
      }),
      15000,
      'Password reset request timed out'
    );

    if (error) throw error;
  } catch (error) {
    console.error('Error during password reset:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'resetPassword');
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to send reset email. Please try again.');
  }
}

export async function updatePassword(newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { error } = await withTimeout(
      supabase.auth.updateUser({
        password: newPassword
      }),
      15000,
      'Password update timed out'
    );

    if (error) throw error;
  } catch (error) {
    console.error('Error updating password:', error);
    trackError(error instanceof Error ? error : new Error(String(error)), undefined, 'updatePassword');
    
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to update password. Please try again.');
  }
}

;