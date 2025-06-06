import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import ListingStatus from '../components/ListingStatus';
import { useListings } from '../hooks/useListings';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function MyListings() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const { 
    myListings,
    loading,
    error,
    loadMyListings,
    deleteListing,
    clearError
  } = useListings(user?.id, {
    fetchMyListingsOnMount: true
  });

  // Set up subscription to listing changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to listing changes
    channelRef.current = subscribeToListingChanges((eventType, listing) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
        // Refresh the listings when changes occur
        loadMyListings();
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        unsubscribeFromListings(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, loadMyListings]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteListing(id);
    } catch (err) {
      console.error('Error deleting listing:', err);
    }
  };

  if (loading && myListings.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <div className="flex gap-4">
          <button
            onClick={() => loadMyListings()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/inventory/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create New Listing
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button 
            onClick={clearError}
            className="text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {myListings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">You haven't created any listings yet.</p>
          <Link
            to="/inventory/new"
            className="text-blue-600 hover:text-blue-800 font-medium inline-block mt-2"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PDI Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listed Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myListings.map((listing) => {
                return (
                  <tr key={listing.id} className="transition-colors duration-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {listing.year} {listing.make} {listing.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          VIN: {listing.vin || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ListingStatus listing={listing} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.pdi_fee !== null ? `$${listing.pdi_fee.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <Link
                          to={`/inventory/edit/${listing.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}