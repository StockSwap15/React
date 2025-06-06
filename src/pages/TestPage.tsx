import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useListings } from '../hooks/useListings';
import { useAdmin } from '../hooks/useAdmin';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import { subscribeToUserChanges, unsubscribeFromAdmin } from '../subscriptions/adminSubscription';

export default function TestPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'admin'>('listings');
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    listings: boolean;
    admin: boolean;
  }>({
    listings: false,
    admin: false
  });
  
  const [listingSubscription, setListingSubscription] = useState<any>(null);
  const [adminSubscription, setAdminSubscription] = useState<any>(null);
  
  // Initialize hooks
  const { 
    listings, 
    myListings, 
    isoListings,
    loading: listingsLoading, 
    error: listingsError,
    loadListings,
    loadMyListings,
    loadISOListings
  } = useListings(user?.id);
  
  const {
    users,
    pendingInvites,
    loading: adminLoading,
    error: adminError,
    loadUsers,
    loadInvitations
  } = useAdmin(user?.id, { fetchOnMount: false });
  
  // Subscription handlers
  const handleToggleListingSubscription = () => {
    if (subscriptionStatus.listings) {
      // Unsubscribe
      if (listingSubscription) {
        unsubscribeFromListings(listingSubscription);
        setListingSubscription(null);
      }
      setSubscriptionStatus(prev => ({ ...prev, listings: false }));
    } else {
      // Subscribe
      if (user) {
        const subscription = subscribeToListingChanges((eventType, listing) => {
          console.log(`Listing ${eventType} event:`, listing.id);
        });
        setListingSubscription(subscription);
        setSubscriptionStatus(prev => ({ ...prev, listings: true }));
      }
    }
  };
  
  const handleToggleAdminSubscription = () => {
    if (subscriptionStatus.admin) {
      // Unsubscribe
      if (adminSubscription) {
        unsubscribeFromAdmin(adminSubscription);
        setAdminSubscription(null);
      }
      setSubscriptionStatus(prev => ({ ...prev, admin: false }));
    } else {
      // Subscribe
      if (user) {
        const subscription = subscribeToUserChanges((eventType, userData) => {
          console.log(`User ${eventType} event:`, userData.id);
        });
        setAdminSubscription(subscription);
        setSubscriptionStatus(prev => ({ ...prev, admin: true }));
      }
    }
  };
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Please sign in to access the test page</p>
        <Link to="/login" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">System Test Page</h1>
      
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admin'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin
          </button>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleToggleListingSubscription}
            className={`px-4 py-2 rounded-lg ${
              subscriptionStatus.listings 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {subscriptionStatus.listings ? 'Listings: Active' : 'Listings: Inactive'}
          </button>
          
          <button
            onClick={handleToggleAdminSubscription}
            className={`px-4 py-2 rounded-lg ${
              subscriptionStatus.admin 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {subscriptionStatus.admin ? 'Admin: Active' : 'Admin: Inactive'}
          </button>
        </div>
      </div>
      
      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button 
              onClick={() => loadListings()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              disabled={listingsLoading}
            >
              {listingsLoading ? 'Loading...' : 'Load Available Listings'}
            </button>
            
            <button 
              onClick={() => loadMyListings()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={listingsLoading}
            >
              {listingsLoading ? 'Loading...' : 'Load My Listings'}
            </button>
            
            <button 
              onClick={() => loadISOListings()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              disabled={listingsLoading}
            >
              {listingsLoading ? 'Loading...' : 'Load ISO Listings'}
            </button>
          </div>
          
          {listingsError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p>{listingsError}</p>
            </div>
          )}
          
          {listingsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Available Listings ({listings.length})</h3>
                <ul className="space-y-2">
                  {listings.slice(0, 5).map(listing => (
                    <li key={listing.id} className="text-sm">
                      {listing.year} {listing.make} {listing.model}
                    </li>
                  ))}
                  {listings.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ...and {listings.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">My Listings ({myListings.length})</h3>
                <ul className="space-y-2">
                  {myListings.slice(0, 5).map(listing => (
                    <li key={listing.id} className="text-sm">
                      {listing.year} {listing.make} {listing.model}
                    </li>
                  ))}
                  {myListings.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ...and {myListings.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">ISO Listings ({isoListings.length})</h3>
                <ul className="space-y-2">
                  {isoListings.slice(0, 5).map(listing => (
                    <li key={listing.id} className="text-sm">
                      {listing.year} {listing.make} {listing.model}
                    </li>
                  ))}
                  {isoListings.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ...and {isoListings.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button 
              onClick={() => loadUsers()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              disabled={adminLoading}
            >
              {adminLoading ? 'Loading...' : 'Load Users'}
            </button>
            
            <button 
              onClick={() => loadInvitations()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={adminLoading}
            >
              {adminLoading ? 'Loading...' : 'Load Invitations'}
            </button>
          </div>
          
          {adminError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p>{adminError}</p>
            </div>
          )}
          
          {adminLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Users ({users.length})</h3>
                <ul className="space-y-2">
                  {users.slice(0, 10).map(user => (
                    <li key={user.id} className="text-sm">
                      <span className="font-medium">{user.email}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'dealer'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.role}
                      </span>
                    </li>
                  ))}
                  {users.length > 10 && (
                    <li className="text-sm text-gray-500">
                      ...and {users.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Invitations ({pendingInvites.length})</h3>
                <ul className="space-y-2">
                  {pendingInvites.slice(0, 10).map(invite => (
                    <li key={invite.id} className="text-sm">
                      <span className="font-medium">{invite.email}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        invite.used_at 
                          ? 'bg-green-100 text-green-800' 
                          : new Date(invite.expires_at) < new Date()
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invite.used_at 
                          ? 'Used' 
                          : new Date(invite.expires_at) < new Date()
                          ? 'Expired'
                          : 'Pending'}
                      </span>
                    </li>
                  ))}
                  {pendingInvites.length > 10 && (
                    <li className="text-sm text-gray-500">
                      ...and {pendingInvites.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}