import { create } from 'zustand';
import type { Listing } from '../types/listing';

interface ListingState {
  listings: Listing[];
  myListings: Listing[];
  isoListings: Listing[];
  selectedListing: Listing | null;
  loading: boolean;
  error: string | null;
  
  // State setters
  setListings: (listings: Listing[]) => void;
  setMyListings: (listings: Listing[]) => void;
  setISOListings: (listings: Listing[]) => void;
  setSelectedListing: (listing: Listing | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Listing operations
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  
  // Fetch operations
  fetchListing: (id: string) => Promise<Listing | null>;
  
  // Utility
  clearError: () => void;
}

export const useListingStore = create<ListingState>((set, get) => ({
  listings: [],
  myListings: [],
  isoListings: [],
  selectedListing: null,
  loading: false,
  error: null,
  
  // State setters
  setListings: (listings) => set({ listings }),
  setMyListings: (listings) => set({ myListings: listings }),
  setISOListings: (listings) => set({ isoListings: listings }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Listing operations
  addListing: (listing) => {
    set(state => {
      // Determine which arrays to update based on listing status and ownership
      const updatedListings = listing.status === 'available' 
        ? [listing, ...state.listings.filter(l => l.id !== listing.id)]
        : state.listings;
        
      const updatedISOListings = listing.status === 'searching'
        ? [listing, ...state.isoListings.filter(l => l.id !== listing.id)]
        : state.isoListings;
        
      // Always add to myListings if the user is the owner
      // Note: This assumes the current user's ID is checked elsewhere
      const updatedMyListings = [listing, ...state.myListings.filter(l => l.id !== listing.id)];
      
      return {
        listings: updatedListings,
        isoListings: updatedISOListings,
        myListings: updatedMyListings,
        selectedListing: state.selectedListing?.id === listing.id 
          ? listing 
          : state.selectedListing
      };
    });
  },
  
  updateListing: (id, updates) => {
    set(state => {
      // Find the listing in all arrays
      const listingInAll = state.listings.find(l => l.id === id);
      const listingInMy = state.myListings.find(l => l.id === id);
      const listingInISO = state.isoListings.find(l => l.id === id);
      
      // Create updated listing objects if they exist
      const updatedListingInAll = listingInAll ? { ...listingInAll, ...updates } : null;
      const updatedListingInMy = listingInMy ? { ...listingInMy, ...updates } : null;
      const updatedListingInISO = listingInISO ? { ...listingInISO, ...updates } : null;
      
      // Update in all relevant arrays
      const updatedListings = state.listings.map(l => 
        l.id === id && updatedListingInAll ? updatedListingInAll : l
      );
      
      const updatedISOListings = state.isoListings.map(l => 
        l.id === id && updatedListingInISO ? updatedListingInISO : l
      );
      
      const updatedMyListings = state.myListings.map(l => 
        l.id === id && updatedListingInMy ? updatedListingInMy : l
      );
      
      // Also update selectedListing if it's the same ID
      const updatedSelectedListing = state.selectedListing?.id === id
        ? { ...state.selectedListing, ...updates }
        : state.selectedListing;
      
      return {
        listings: updatedListings,
        isoListings: updatedISOListings,
        myListings: updatedMyListings,
        selectedListing: updatedSelectedListing
      };
    });
  },
  
  removeListing: (id) => {
    set(state => ({
      listings: state.listings.filter(l => l.id !== id),
      isoListings: state.isoListings.filter(l => l.id !== id),
      myListings: state.myListings.filter(l => l.id !== id),
      selectedListing: state.selectedListing?.id === id 
        ? null 
        : state.selectedListing
    }));
  },
  
  // Fetch operations
  fetchListing: async (id) => {
    const state = get();
    
    // First check if we already have the listing in state
    const existingListing = state.selectedListing?.id === id
      ? state.selectedListing
      : state.listings.find(l => l.id === id) ||
        state.myListings.find(l => l.id === id) ||
        state.isoListings.find(l => l.id === id);
    
    if (existingListing) {
      set({ selectedListing: existingListing });
      return existingListing;
    }
    
    // If not in state, fetch from API
    try {
      set({ loading: true, error: null });
      
      const { supabase } = await import('../lib/supabase');
      
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select(`
          *,
          dealer:profiles!listings_dealer_id_fkey (
            dealer_name,
            phone,
            address,
            email
          ),
          model_codes (
            code
          )
        `)
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      set({ selectedListing: data });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch listing';
      set({ error: message });
      console.error('Error fetching listing details:', message);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  // Utility
  clearError: () => set({ error: null })
}));