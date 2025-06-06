import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Share2, MapPin, AlertCircle, Package, Calendar, Key, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useListingStore } from '../lib/listingStore';
import ListingStatus from '../components/ListingStatus';
import { useRealtimeKeepAlive } from '../lib/realtimeManager';
import ContactButton from '../components/ContactButton';
import NotFoundPage from './NotFoundPage';

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    fetchListing, 
    selectedListing, 
    loading, 
    error, 
    clearError,
    subscribeToListings,
    unsubscribeFromListings
  } = useListingStore();

  // Validate id parameter
  if (!id) {
    return <NotFoundPage />;
  }

  // Use the realtimeKeepAlive hook to maintain subscriptions
  useRealtimeKeepAlive({
    subscribeToListings: true
  });

  useEffect(() => {
    fetchListing(id);
  }, [id, fetchListing]);

  const handleShare = async () => {
    if (!selectedListing) return;
    
    try {
      await navigator.share({
        title: `${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`,
        text: `Check out this ${selectedListing.year} ${selectedListing.make} ${selectedListing.model} on StockSwap`,
        url: window.location.href
      });
    } catch (err) {
      console.log('Sharing failed:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !selectedListing) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>{error || 'Listing not found'}</p>
        </div>
        {error && (
          <button 
            onClick={clearError}
            className="text-sm underline"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  const isSearching = selectedListing.status === 'searching';
  const backLink = isSearching ? '/iso' : '/inventory';
  const backText = isSearching ? 'Back to Vehicle Requests' : 'Back to Available Vehicles';
  const isOwner = user?.id === selectedListing.dealer_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          to={backLink}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {backText}
        </Link>
        <div className="flex gap-4">
          {isOwner && (
            <Link
              to={`/inventory/edit/${selectedListing.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Listing
            </Link>
          )}
          <button
            onClick={handleShare}
            className="text-gray-600 hover:text-gray-900"
            title="Share listing"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {selectedListing.photo_url ? (
          <img
            src={selectedListing.photo_url}
            alt={`${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`}
            className="w-full h-96 object-cover"
          />
        ) : (
          <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedListing.year} {selectedListing.make} {selectedListing.model}
              </h1>
              <div className="mt-2 space-y-1">
                {selectedListing.vin && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    VIN: {selectedListing.vin}
                  </p>
                )}
                {selectedListing.dealer?.dealer_name && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {selectedListing.dealer.dealer_name}
                  </p>
                )}
                {selectedListing.dealer?.phone && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="h-4 w-4">📞</span>
                    {selectedListing.dealer.phone}
                  </p>
                )}
                {(selectedListing.location || selectedListing.dealer?.address) && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedListing.location || selectedListing.dealer?.address}
                  </p>
                )}
              </div>
            </div>
            <ListingStatus listing={selectedListing} className="text-sm" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {selectedListing.pdi_fee !== null && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">PDI Fee</p>
                  <p className="font-semibold">${selectedListing.pdi_fee.toFixed(2)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Listed Date</p>
                <p className="font-semibold">
                  {new Date(selectedListing.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {selectedListing.condition_notes && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="font-semibold">Condition Notes</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedListing.condition_notes}
              </p>
            </div>
          )}

          {!isOwner && user && (
            <div className="mt-6 flex justify-end">
              <ContactButton 
                resourceType={isSearching ? 'iso' : 'listing'}
                resourceId={selectedListing.id}
                ownerId={selectedListing.dealer_id}
                label="Contact Dealer"
                size="lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}