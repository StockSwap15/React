import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useListings } from '../hooks/useListings';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import type { RealtimeChannel } from '@supabase/supabase-js';
import NotFoundPage from './NotFoundPage';

export default function InSearchOf() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const { 
    isoListings: listings, 
    loading, 
    error, 
    loadISOListings,
    clearError
  } = useListings(user?.id, {
    fetchISOListingsOnMount: true
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
      if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
        // Refresh the listings when changes occur
        loadISOListings();
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        unsubscribeFromListings(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, loadISOListings]);

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
  function applySearchFilters(listing) {
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
    .filter(make => profile?.role === 'admin' || !profile?.brands || profile.brands.includes(make))
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
  
  if (loading && listings.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Vehicle Requests</h1>
        <div className="flex gap-4">
          {user && (
            <Link
              to="/iso/new"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Post Request
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="search"
              placeholder="Search listings..."
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
          <p className="text-gray-500 text-lg">No vehicle requests found.</p>
          <p className="text-gray-400">Try adjusting your filters or create a new request.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dealer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr 
                  key={listing.id}
                  className="transition-colors duration-300"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {listing.year} {listing.make} {listing.model}
                      </div>
                      {listing.model_codes && (
                        <div className="text-gray-500">
                          Model Code: {listing.model_codes.code}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {listing.dealer?.dealer_name || 'No Name'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {listing.dealer?.phone && (
                        <div className="text-gray-500">
                          Phone: {listing.dealer.phone}
                        </div>
                      )}
                      <div className="text-gray-500">
                        Email: {listing.dealer?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/inventory/${listing.id}`}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}