import { supabase } from '../lib/supabase';
import { Listing, ListingFormData } from '../types/listing';
import { withTimeout, retryWithBackoff } from '../utils/errors';
import { listingSchema } from '../lib/validation';

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at,
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
        .eq('status', 'available')
        .order('created_at', { ascending: false }),
      30000,
      'Listings fetch timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data || [];
}

export async function fetchMyListings(): Promise<Listing[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at,
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
        .eq('dealer_id', user.id)
        .order('created_at', { ascending: false }),
      30000,
      'My listings fetch timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data || [];
}

export async function fetchISOListings(): Promise<Listing[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at,
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
        .eq('status', 'searching')
        .order('created_at', { ascending: false }),
      30000,
      'ISO listings fetch timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data || [];
}

async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at,
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
        .single(),
      30000,
      'Listing fetch timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data;
}

export async function createListing(listing: ListingFormData): Promise<Listing> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Validate input data
  const validatedListing = listingSchema.parse(listing);
  
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .insert({ ...validatedListing, dealer_id: user.id })
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at
        `)
        .single(),
      30000,
      'Listing creation timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data;
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  // Validate input data - partial schema
  const validatedUpdates = listingSchema.partial().parse(updates);
  
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .update(validatedUpdates)
        .eq('id', id)
        .select(`
          id, 
          dealer_id, 
          make, 
          model, 
          year, 
          vin, 
          pdi_fee, 
          condition_notes, 
          status, 
          created_at, 
          updated_at, 
          location, 
          photo_url, 
          segment_id, 
          model_id, 
          model_code_id,
          expires_at,
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
        .single(),
      30000,
      'Listing update timed out'
    );
  }, 5);
  
  if (error) throw error;
  return data;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('listings')
        .delete()
        .eq('id', id),
      30000,
      'Listing deletion timed out'
    );
  }, 5);
  
  if (error) throw error;
}

export async function renewListing(id: string): Promise<void> {
  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .rpc('renew_listing', { listing_id: id }),
      30000,
      'Listing renewal timed out'
    );
  }, 5);
  
  if (error) throw error;
}