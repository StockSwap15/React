import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  fetchUsers, 
  fetchInvitations, 
  createInvitation as createInvitationService,
  deleteInvitation as deleteInvitationService,
  updateUser as updateUserService,
  approveUser as approveUserService,
  rejectUser as rejectUserService,
  fetchVehicleBrands as fetchVehicleBrandsService
} from '../services/adminService';
import { showError, showSuccess } from '../utils/toast';
import type { AppUser, AppUserFormData, InviteFormData, Invitation } from '../types/admin';
import { useAdminStore } from '../stores/adminStore';

interface UseAdminOptions {
  fetchOnMount?: boolean;
  subscribeToChanges?: boolean;
}

export function useAdmin(userId?: string, options: UseAdminOptions = {}) {
  const { fetchOnMount = true } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  const {
    users,
    pendingUsers,
    activeUsers,
    pendingInvites,
    brands,
    setUsers,
    setPendingUsers,
    setActiveUsers,
    setPendingInvites,
    setBrands,
    addUser,
    updateUserInStore,
    removeUser,
    addInvite,
    removeInvite,
    clearError: clearStoreError
  } = useAdminStore();

  // Set up isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load users on mount if enabled
  useEffect(() => {
    if (fetchOnMount && userId) {
      loadUsers();
      loadInvitations();
      loadBrands();
    }
  }, [userId, fetchOnMount]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedUsers = await fetchUsers();
      
      if (isMounted.current) {
        // Use batch updates for Zustand state
        setUsers(fetchedUsers);
        
        // Split users into pending and active
        setPendingUsers(fetchedUsers.filter(user => 
          user.role === 'pending' && user.updated_at === user.created_at
        ));
        
        setActiveUsers(fetchedUsers.filter(user => 
          user.role !== 'pending'
        ));
      }
      
      return fetchedUsers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [setUsers, setPendingUsers, setActiveUsers, clearStoreError]);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedInvitations = await fetchInvitations();
      
      if (isMounted.current) {
        setPendingInvites(fetchedInvitations);
      }
      
      return fetchedInvitations;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invitations';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [setPendingInvites, clearStoreError]);

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedBrands = await fetchVehicleBrandsService();
      
      if (isMounted.current) {
        setBrands(fetchedBrands);
      }
      
      return fetchedBrands;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch brands';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [setBrands, clearStoreError]);

  const updateUser = useCallback(async (userId: string, updates: AppUserFormData) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Optimistically update the UI
      updateUserInStore(userId, updates);
      
      const controller = new AbortController();
      await updateUserService(userId, updates);
      
      if (isMounted.current) {
        showSuccess('User updated successfully');
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadUsers();
      }
      
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateUserInStore, loadUsers, clearStoreError]);

  const approveUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Optimistically update the UI
      updateUserInStore(userId, { role: 'dealer' });
      
      const controller = new AbortController();
      await approveUserService(userId);
      
      if (isMounted.current) {
        showSuccess('User approved successfully');
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve user';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadUsers();
      }
      
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateUserInStore, loadUsers, clearStoreError]);

  const rejectUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Optimistically update the UI
      updateUserInStore(userId, { role: 'pending' });
      
      const controller = new AbortController();
      await rejectUserService(userId);
      
      if (isMounted.current) {
        showSuccess('User rejected successfully');
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject user';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadUsers();
      }
      
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateUserInStore, loadUsers, clearStoreError]);

  const createInvitation = useCallback(async (inviteData: InviteFormData) => {
    if (!userId) throw new Error('User ID is required to create an invitation');
    
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      const controller = new AbortController();
      const invitation = await createInvitationService(inviteData, userId);
      
      // Update invitations list
      if (isMounted.current) {
        addInvite(invitation);
        showSuccess('Invitation sent successfully');
      }
      
      return invitation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invitation';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, addInvite, clearStoreError]);

  const deleteInvitation = useCallback(async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Optimistically update UI
      removeInvite(invitationId);

      const controller = new AbortController();
      await deleteInvitationService(invitationId);
      
      if (isMounted.current) {
        showSuccess('Invitation deleted successfully');
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete invitation';
      if (isMounted.current) {
        setError(message);
        showError(message);
      }
      
      // Revert optimistic update on error
      if (isMounted.current) {
        await loadInvitations();
      }
      
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loadInvitations, removeInvite, clearStoreError]);

  return {
    users,
    pendingUsers,
    activeUsers,
    pendingInvites,
    brands,
    loading,
    error,
    loadUsers,
    loadInvitations,
    loadBrands,
    updateUser,
    approveUser,
    rejectUser,
    createInvitation,
    deleteInvitation,
    clearError: () => {
      setError(null);
      clearStoreError();
    },
    
    // Functions for real-time updates
    addUser,
    updateUserInStore,
    removeUser,
    addInvite,
    removeInvite
  };
}