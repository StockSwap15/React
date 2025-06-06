import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Tag, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import ListingStatus from '../components/ListingStatus';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useListings } from '../hooks/useListings';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import type { Listing } from '../types/listing';
import type { RealtimeChannel } from '@supabase/supabase-js';
import NotFoundPage from './NotFoundPage';

const Inventory = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const { 
    listings,
    loading, 
    error,
    loadListings,
    addListing,
    updateListing,
    removeListing,
    clearError
  } = useListings(user?.id, {
    fetchOnMount: true,
    subscribeToChanges: false // We'll handle subscriptions manually
  });

  const [filters, setFilters] = useState({
    search: '',
    make: '',
    year: '',
  });

  // Validate user is authenticated
  if (!user || !user.id) {
    return <NotFoundPage />;
  }

  // Set up subscription to listing changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to listing changes
    channelRef.current = subscribeToListingChanges((eventType, listing) => {
      if (eventType === 'INSERT' && listing.status === 'available') {
        addListing(listing);
      } else if (eventType === 'UPDATE') {
        updateListing(listing.id, listing);
      } else if (eventType === 'DELETE') {
        removeListing(listing.id);
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        unsubscribeFromListings(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, addListing, updateListing, removeListing]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters to listings
  const filteredListings = listings.filter(listing => {
    // Skip brand filtering if user is admin
    if (profile?.role === 'admin') {
      return applySearchFilters(listing);
    }
    
    // Filter by user's assigned brands
    const brandMatch = profile?.brands?.includes(listing.make) || false;
    return brandMatch && applySearchFilters(listing);
  });
  
  // Apply search, make, and year filters
  function applySearchFilters(listing: Listing) {
    const searchMatch = filters.search
      ? `${listing.make} ${listing.model} ${listing.year} ${listing.model_codes?.code || ''}`
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true;

    const makeMatch = filters.make ? listing.make === filters.make : true;
    const yearMatch = filters.year ? listing.year.toString() === filters.year : true;

    return searchMatch && makeMatch && yearMatch;
  }

  // Get unique makes and years for filters
  const uniqueMakes = Array.from(new Set(listings.map(l => l.make)))
    .filter(make => profile?.role === 'admin' || !profile?.brands || profile?.brands?.includes(make))
    .sort();
    
  const uniqueYears = Array.from(new Set(listings.map(l => l.year)))
    .sort((a, b) => b - a);

  if (!profile?.brands?.length && profile?.role !== 'admin') {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg text-center">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Brands Assigned</h2>
        <p className="text-yellow-700">
          You don't have any brands assigned to your profile. Please contact an administrator to get access.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Available Vehicles</h1>
        <div className="flex gap-4">
          {user && (
            <Link
              to="/my-listings"
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              My Listings
            </Link>
          )}
          <Link
            to="/inventory/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post New Listing
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="search"
              placeholder="Search by make, model, year, or model code..."
              value={filters.search}
              onChange={handleFilterChange}
              className="pl-10 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              className="pl-10 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Makes</option>
              {uniqueMakes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
          <select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <button 
            onClick={clearError}
            className="text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No vehicles available.</p>
          <p className="text-gray-400">Try adjusting your filters or create a new listing.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div 
              key={listing.id} 
              className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300"
            >
              <div className="relative w-full h-48">
                {listing.photo_url ? (
                  <img
                    src={listing.photo_url}
                    alt={`${listing.year} ${listing.make} ${listing.model}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {listing.year} {listing.make} {listing.model}
                    </h2>
                    {listing.model_codes?.code && (
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <Tag className="h-4 w-4" />
                        <span>Model Code: {listing.model_codes.code}</span>
                      </div>
                    )}
                    {listing.vin && <p className="text-gray-600">VIN: {listing.vin}</p>}
                    {listing.dealer?.dealer_name && (
                      <p className="text-gray-600 mt-1">{listing.dealer.dealer_name}</p>
                    )}
                    {listing.dealer?.phone && (
                      <p className="text-gray-600 mt-1">Phone: {listing.dealer.phone}</p>
                    )}
                    {(listing.location || listing.dealer?.address) && (
                      <p className="text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {listing.location || listing.dealer?.address}
                      </p>
                    )}
                  </div>
                  <ListingStatus listing={listing} />
                </div>
                <div className="space-y-2">
                  {listing.pdi_fee !== null && (
                    <p className="text-gray-700">
                      <strong>PDI Fee:</strong> ${listing.pdi_fee.toFixed(2)}
                    </p>
                  )}
                  {listing.condition_notes && (
                    <p className="text-gray-700">
                      <strong>Condition:</strong> {listing.condition_notes}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/inventory/${listing.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;