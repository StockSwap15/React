import { create } from 'zustand';
import type { AppUser, Invitation } from '../types/user';

interface AdminState {
  // State
  users: AppUser[];
  pendingUsers: AppUser[];
  activeUsers: AppUser[];
  pendingInvites: Invitation[];
  brands: {id: string, name: string}[];
  loading: boolean;
  error: string | null;

  // Synchronous actions
  setUsers: (users: AppUser[]) => void;
  setPendingUsers: (users: AppUser[]) => void;
  setActiveUsers: (users: AppUser[]) => void;
  setPendingInvites: (invites: Invitation[]) => void;
  setBrands: (brands: {id: string, name: string}[]) => void;
  addUser: (user: AppUser) => void;
  updateUserInStore: (id: string, updates: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  addInvite: (invite: Invitation) => void;
  removeInvite: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Initial state
  users: [],
  pendingUsers: [],
  activeUsers: [],
  pendingInvites: [],
  brands: [],
  loading: false,
  error: null,

  // Synchronous actions
  setUsers: (users) => 
    set(() => ({
      users
    })),

  setPendingUsers: (pendingUsers) => 
    set(() => ({
      pendingUsers
    })),

  setActiveUsers: (activeUsers) => 
    set(() => ({
      activeUsers
    })),

  setPendingInvites: (pendingInvites) => 
    set(() => ({
      pendingInvites
    })),

  setBrands: (brands) => 
    set(() => ({
      brands
    })),

  addUser: (user) => 
    set((state) => ({
      users: [...state.users, user]
    })),

  updateUserInStore: (id, updates) => 
    set((state) => ({
      users: state.users.map(user => 
        user.id === id ? { ...user, ...updates } : user
      )
    })),

  removeUser: (id) => 
    set((state) => ({
      users: state.users.filter(user => user.id !== id)
    })),

  addInvite: (invite) => 
    set((state) => ({
      pendingInvites: [...state.pendingInvites, invite]
    })),

  removeInvite: (id) => 
    set((state) => ({
      pendingInvites: state.pendingInvites.filter(invite => invite.id !== id)
    })),

  setLoading: (loading) => 
    set(() => ({
      loading
    })),

  setError: (error) => 
    set(() => ({
      error
    })),

  clearError: () => 
    set(() => ({
      error: null
    }))
}));