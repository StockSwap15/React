import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Check, X, Search, User, Send, Edit2, Package, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAdmin } from '../hooks/useAdmin';
import { useListings } from '../hooks/useListings';
import { subscribeToUserChanges, subscribeToInvitationChanges, unsubscribeFromAdmin } from '../subscriptions/adminSubscription';
import { subscribeToListingChanges, unsubscribeFromListings } from '../subscriptions/listingSubscription';
import type { AppUserFormData, InviteFormData } from '../types/admin';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Listing } from '../types/listing';
import NotFoundPage from './NotFoundPage';

type EditingUser = {
  id: string;
  dealer_name: string | null;
  phone: string | null;
  address: string | null;
  brands: string[];
  role: 'pending' | 'dealer' | 'admin';
};

type UserStatus = 'all' | 'pending' | 'active' | 'inactive';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [userStatus, setUserStatus] = useState<UserStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  
  const userChannelRef = useRef<RealtimeChannel | null>(null);
  const inviteChannelRef = useRef<RealtimeChannel | null>(null);
  const listingChannelRef = useRef<RealtimeChannel | null>(null);
  
  const {
    users,
    pendingUsers,
    activeUsers,
    pendingInvites,
    brands,
    loading: adminLoading,
    error: adminError,
    loadUsers,
    loadInvitations,
    updateUser,
    approveUser,
    rejectUser,
    createInvitation,
    deleteInvitation,
    clearError: clearAdminError,
    addUser,
    updateUserInStore,
    removeUser,
    addInvite,
    removeInvite
  } = useAdmin(user?.id, {
    fetchOnMount: true,
    subscribeToChanges: false // We'll handle subscriptions manually
  });

  const {
    listings,
    myListings,
    isoListings,
    loading: listingsLoading,
    error: listingsError,
    loadListings,
    loadMyListings,
    loadISOListings,
    clearError: clearListingsError,
    addListing,
    updateListing: updateListingInStore,
    removeListing
  } = useListings(user?.id, {
    fetchOnMount: false,
    subscribeToChanges: false // We'll handle subscriptions manually
  });

  // Validate user is admin
  if (!user || !user.id) {
    return <NotFoundPage />;
  }

  // Set up subscription to user and invitation changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to user changes
    userChannelRef.current = subscribeToUserChanges((eventType, userData) => {
      if (eventType === 'INSERT') {
        addUser(userData);
      } else if (eventType === 'UPDATE') {
        updateUserInStore(userData.id, userData);
      } else if (eventType === 'DELETE') {
        removeUser(userData.id);
      }
    });
    
    // Subscribe to invitation changes
    inviteChannelRef.current = subscribeToInvitationChanges((eventType, invite) => {
      if (eventType === 'INSERT') {
        addInvite(invite);
      } else if (eventType === 'UPDATE') {
        // For updates, we'll just remove and add again
        removeInvite(invite.id);
        addInvite(invite);
      } else if (eventType === 'DELETE') {
        removeInvite(invite.id);
      }
    });

    // Subscribe to listing changes
    listingChannelRef.current = subscribeToListingChanges((eventType, listing) => {
      if (eventType === 'INSERT') {
        addListing(listing);
      } else if (eventType === 'UPDATE') {
        updateListingInStore(listing);
      } else if (eventType === 'DELETE') {
        removeListing(listing.id);
      }
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      if (userChannelRef.current) {
        unsubscribeFromAdmin(userChannelRef.current);
        userChannelRef.current = null;
      }
      
      if (inviteChannelRef.current) {
        unsubscribeFromAdmin(inviteChannelRef.current);
        inviteChannelRef.current = null;
      }

      if (listingChannelRef.current) {
        unsubscribeFromListings(listingChannelRef.current);
        listingChannelRef.current = null;
      }
    };
  }, [user, addUser, updateUserInStore, removeUser, addInvite, removeInvite, addListing, updateListingInStore, removeListing]);

  // Load listings when the listings tab is selected
  useEffect(() => {
    if (activeTab === 'listings' && user) {
      loadListings();
      loadISOListings();
    }
  }, [activeTab, user, loadListings, loadISOListings]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail.trim()) return;

    try {
      const inviteData: InviteFormData = {
        email: newInviteEmail.trim()
      };
      
      await createInvitation(inviteData);
      setNewInviteEmail('');
    } catch (err) {
      console.error('Failed to create invitation:', err);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!id) {
      console.error('No invitation ID provided');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this invitation?')) {
      return;
    }

    try {
      await deleteInvitation(id);
    } catch (err) {
      console.error('Failed to delete invitation:', err);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'dealer' | 'pending') => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }
    
    try {
      await updateUser(userId, { role: newRole });
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }
    
    try {
      await approveUser(userId);
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!userId) {
      console.error('No user ID provided');
      return;
    }
    
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return;
    }
    
    try {
      await rejectUser(userId);
    } catch (err) {
      console.error('Failed to reject user:', err);
    }
  };

  const handleEditUser = (userData: any) => {
    if (!userData || !userData.id) {
      console.error('Invalid user data');
      return;
    }
    
    setEditingUser({
      id: userData.id,
      dealer_name: userData.dealer_name || '',
      phone: userData.phone || '',
      address: userData.address || '',
      brands: userData.brands || [],
      role: userData.role
    });
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.id) {
      console.error('No user being edited');
      return;
    }

    try {
      if (!editingUser.dealer_name?.trim()) {
        throw new Error('Dealer name is required');
      }

      const updates: AppUserFormData = {
        dealer_name: editingUser.dealer_name.trim(),
        phone: editingUser.phone?.trim() || null,
        address: editingUser.address?.trim() || null,
        brands: editingUser.brands,
        role: editingUser.role
      };

      await updateUser(editingUser.id, updates);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user details:', err);
    }
  };

  const getFilteredUsers = () => {
    if (!searchTerm && userStatus === 'all') return users;

    return users.filter(user => {
      // Status filter
      if (userStatus === 'pending' && user.role !== 'pending') return false;
      if (userStatus === 'active' && user.role === 'pending') return false;
      if (userStatus === 'inactive' && user.role !== 'pending') return false;

      // Search filter
      if (searchTerm) {
        const searchString = `${user.email} ${user.dealer_name || ''} ${user.phone || ''} ${user.address || ''}`.toLowerCase();
        if (!searchString.includes(searchTerm.toLowerCase())) return false;
      }

      return true;
    });
  };

  const getFilteredListings = () => {
    if (!searchTerm) return listings;

    return listings.filter(listing => {
      const searchString = `${listing.make} ${listing.model} ${listing.year} ${listing.vin || ''} ${listing.dealer?.dealer_name || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  };

  const getUserCounts = () => {
    return {
      all: users.length,
      pending: users.filter(u => u.role === 'pending' && u.updated_at === u.created_at).length,
      active: users.filter(u => u.role !== 'pending').length,
      inactive: users.filter(u => u.role === 'pending' && u.updated_at !== u.created_at).length
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const counts = getUserCounts();

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-600" />
          <span className="font-semibold text-indigo-600">Admin Control Panel</span>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'users', label: 'Users', icon: User },
            { id: 'listings', label: 'Listings', icon: Package },
            { id: 'invitations', label: 'Invitations', icon: Mail },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {adminError && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{adminError}</span>
          </div>
          <button onClick={clearAdminError}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {listingsError && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{listingsError}</span>
          </div>
          <button onClick={clearListingsError}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setUserStatus('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userStatus === 'all'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Users ({counts.all})
                </button>
                <button
                  onClick={() => setUserStatus('pending')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userStatus === 'pending'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pending ({counts.pending})
                </button>
                <button
                  onClick={() => setUserStatus('active')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userStatus === 'active'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active ({counts.active})
                </button>
                <button
                  onClick={() => setUserStatus('inactive')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userStatus === 'inactive'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inactive ({counts.inactive})
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {adminLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
              {getFilteredUsers().map(user => {
                const isPending = user.role === 'pending' && user.updated_at === user.created_at;
                const isInactive = user.role === 'pending' && user.updated_at !== user.created_at;

                return (
                  <div key={user.id} className="flex items-center justify-between bg-white px-3 py-2 border-b last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate">
                          <span className="text-sm font-medium">{user.dealer_name || 'No Name'}</span>
                          <span className="text-xs text-gray-500 ml-2">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!isInactive && (
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'admin' | 'dealer' | 'pending')}
                              disabled={adminLoading}
                              className={`text-xs h-5 min-h-0 py-0 pl-1 pr-4 rounded appearance-none cursor-pointer ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : user.role === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              } bg-no-repeat bg-[right_2px_center] bg-[length:16px_16px] bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")]`}
                              style={{ backgroundSize: '12px' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="dealer">Dealer</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            isInactive ? 'bg-red-100 text-red-800' :
                            isPending ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {isInactive ? 'Inactive' : isPending ? 'Pending' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                        <div className="flex gap-1">
                          {isInactive ? (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              disabled={adminLoading}
                              className="text-xs text-green-600 hover:text-green-800 px-1.5 py-0.5"
                            >
                              Reactivate
                            </button>
                          ) : isPending ? (
                            <>
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                disabled={adminLoading}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                disabled={adminLoading}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {!isInactive && (
                                <button
                                  onClick={() => handleRejectUser(user.id)}
                                  disabled={adminLoading}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {getFilteredUsers().length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No users found matching your criteria
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={loadListings}
              disabled={listingsLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {listingsLoading ? 'Loading...' : 'Refresh Listings'}
            </button>
          </div>

          {listingsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dealer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredListings().map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {listing.year} {listing.make} {listing.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {listing.vin ? `VIN: ${listing.vin}` : 'No VIN'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {listing.dealer?.dealer_name || 'Unknown Dealer'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {listing.dealer?.email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          listing.status === 'available' ? 'bg-green-100 text-green-800' :
                          listing.status === 'searching' ? 'bg-blue-100 text-blue-800' :
                          listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          listing.status === 'sold' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(listing.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/inventory/${listing.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/inventory/edit/${listing.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {getFilteredListings().length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No listings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manage Invitations</h2>
            <form onSubmit={handleCreateInvitation} className="flex gap-2">
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={adminLoading || !newInviteEmail.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send Invitation
              </button>
            </form>
          </div>

          {adminLoading && pendingInvites.length === 0 ? (
            <LoadingSpinner />
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4" />
              <p>No active invitations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvites.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          invitation.used_at
                            ? 'bg-green-100 text-green-800'
                            : new Date(invitation.expires_at) < new Date()
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invitation.used_at
                            ? 'Used'
                            : new Date(invitation.expires_at) < new Date()
                            ? 'Expired'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          disabled={adminLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit User Details</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUserDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dealer Name *
                </label>
                <input
                  type="text"
                  value={editingUser.dealer_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, dealer_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  value={editingUser.address || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    role: e.target.value as 'pending' | 'dealer' | 'admin'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authorized Brands
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingUser.brands.includes(brand.name)}
                        onChange={(e) => {
                          const newBrands = e.target.checked
                            ? [...editingUser.brands, brand.name]
                            : editingUser.brands.filter(b => b !== brand.name);
                          setEditingUser({ ...editingUser, brands: newBrands });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adminLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;