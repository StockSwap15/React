import { useState, useCallback, useEffect, useRef } from 'react';
import { showError, showSuccess } from '../utils/toast';
import { useListingStore } from '../stores/listingStore';
import { 
  fetchListings as fetchListingsService,
  fetchMyListings as fetchMyListingsService,
  fetchISOListings as fetchISOListingsService,
  createListing as createListingService,
  updateListing as updateListingService,
  deleteListing as deleteListingService,
  renewListing as renewListingService
} from '../services/listingService';
import type { Listing, ListingFormData } from '../types/listing';

interface UseListingsOptions {
  fetchOnMount?: boolean;
  fetchMyListingsOnMount?: boolean;
  fetchISOListingsOnMount?: boolean;
  subscribeToChanges?: boolean;
}

export function useListings(userId?: string, options: UseListingsOptions = {}) {
  const { 
    fetchOnMount = false, 
    fetchMyListingsOnMount = false,
    fetchISOListingsOnMount = false,
    subscribeToChanges = false
  } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  const { 
    listings, 
    myListings, 
    isoListings,
    setListings,
    setMyListings,
    setISOListings,
    addListing: addListingToStore,
    updateListing: updateListingInStore,
    removeListing: removeListingFromStore,
    setError: setStoreError,
    clearError: clearStoreError
  } = useListingStore();

  // Set up isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load listings on mount if enabled
  useEffect(() => {
    if (userId) {
      if (fetchOnMount) {
        loadListings();
      }
      if (fetchMyListingsOnMount) {
        loadMyListings();
      }
      if (fetchISOListingsOnMount) {
        loadISOListings();
      }
    }
  }, [userId, fetchOnMount, fetchMyListingsOnMount, fetchISOListingsOnMount]);

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedListings = await fetchListingsService();
      
      if (isMounted.current) {
        setListings(fetchedListings);
      }
      
      return fetchedListings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch listings';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [setListings, clearStoreError, setStoreError]);

  const loadMyListings = useCallback(async () => {
    if (!userId) return [];
    
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedListings = await fetchMyListingsService();
      
      if (isMounted.current) {
        setMyListings(fetchedListings);
      }
      
      return fetchedListings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch your listings';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId, setMyListings, clearStoreError, setStoreError]);

  const loadISOListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      const fetchedListings = await fetchISOListingsService();
      
      if (isMounted.current) {
        setISOListings(fetchedListings);
      }
      
      return fetchedListings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ISO listings';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [setISOListings, clearStoreError, setStoreError]);

  const createListing = useCallback(async (listing: ListingFormData) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      const controller = new AbortController();
      const result = await createListingService(listing);
      
      if (isMounted.current) {
        // Add to appropriate listings array based on status
        addListingToStore(result);
        showSuccess('Listing created successfully');
      }
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [addListingToStore, clearStoreError, setStoreError]);

  const updateListing = useCallback(async (id: string, updates: Partial<Listing>) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Apply optimistic update
      updateListingInStore(id, updates);
      
      const controller = new AbortController();
      const updatedListing = await updateListingService(id, updates);
      
      if (isMounted.current) {
        // Update with the actual response data
        if (updatedListing) {
          updateListingInStore(id, updatedListing);
        }
        showSuccess('Listing updated successfully');
      }
      
      return updatedListing;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update listing';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      
        // Revert optimistic update on error
        await loadListings();
        await loadMyListings();
        await loadISOListings();
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateListingInStore, loadListings, loadMyListings, loadISOListings, clearStoreError, setStoreError]);

  const deleteListing = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();

      // Apply optimistic delete
      removeListingFromStore(id);
      
      const controller = new AbortController();
      await deleteListingService(id);
      
      if (isMounted.current) {
        showSuccess('Listing deleted successfully');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete listing';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      
        // Revert optimistic delete on error
        await loadListings();
        await loadMyListings();
        await loadISOListings();
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [removeListingFromStore, loadListings, loadMyListings, loadISOListings, clearStoreError, setStoreError]);

  const renewListing = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      clearStoreError();
      
      const controller = new AbortController();
      await renewListingService(id);
      
      // Refresh listings to get updated expiration date
      await loadListings();
      await loadMyListings();
      
      if (isMounted.current) {
        showSuccess('Listing renewed successfully');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew listing';
      if (isMounted.current) {
        setError(message);
        setStoreError(message);
        showError(message);
      }
      throw err;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [loadListings, loadMyListings, clearStoreError, setStoreError]);

  return {
    listings,
    myListings,
    isoListings,
    loading,
    error,
    loadListings,
    loadMyListings,
    loadISOListings,
    createListing,
    updateListing,
    deleteListing,
    renewListing,
    addListing: addListingToStore,
    removeListing: removeListingFromStore,
    clearError: () => {
      setError(null);
      clearStoreError();
    }
  };
}