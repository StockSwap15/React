import { supabase } from '../lib/supabase';
import { Listing } from '../types/listing';
import { NetworkStatus } from '../lib/network';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ListingChangeHandler = (eventType: 'INSERT' | 'UPDATE' | 'DELETE', listing: Listing) => void;

/**
 * Subscribe to listing changes
 * @param onListingChange Callback function to handle listing changes
 * @returns The Supabase channel subscription
 */
export function subscribeToListingChanges(onListingChange: ListingChangeHandler): RealtimeChannel {
  console.log('Setting up listings subscription');
  
  const channel = supabase
    .channel('listings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'listings'
      },
      async (payload) => {
        try {
          console.log('Received listing change:', payload.eventType, payload.new?.id);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch the complete listing with joins
            const { data } = await supabase
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
              .eq('id', payload.new.id)
              .single();
              
            if (data) {
              onListingChange(payload.eventType as 'INSERT' | 'UPDATE', data);
            }
          } else if (payload.eventType === 'DELETE') {
            // For deletions, we just need the ID which is in payload.old
            onListingChange('DELETE', payload.old as Listing);
          }
        } catch (err) {
          console.error('Error in listing changes subscription handler:', err);
        }
      }
    );
    
  // Subscribe to the channel
  channel.subscribe((status) => {
    console.log('Listings subscription status:', status);
  });

  // Register the channel with NetworkStatus for proper cleanup
  if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.registerChannel === 'function') {
    NetworkStatus.registerChannel(channel);
  }
  
  return channel;
}

/**
 * Unsubscribe from listings
 * @param subscription The subscription to unsubscribe from
 */
export function unsubscribeFromListings(subscription: RealtimeChannel): void {
  if (subscription) {
    console.log('Unsubscribing from listings');
    if (typeof NetworkStatus !== 'undefined' && typeof NetworkStatus.removeChannel === 'function') {
      NetworkStatus.removeChannel(subscription);
    } else {
      supabase.removeChannel(subscription);
    }
  }
}