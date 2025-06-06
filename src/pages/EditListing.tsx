import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import PhotoUpload from '../components/PhotoUpload';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useListingStore } from '../lib/listingStore';
import NotFoundPage from './NotFoundPage';

type ListingFormData = {
  make: string;
  model: string;
  year: number;
  vin: string;
  pdi_fee: number;
  condition_notes: string;
  status: 'available' | 'pending' | 'sold' | 'cancelled' | 'searching';
  photo_url: string | null;
  location: string;
};

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<ListingFormData | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedListing,
    fetchListing, 
    updateListing, 
    loading, 
    error, 
    clearError 
  } = useListingStore();

  // Validate id parameter
  if (!id) {
    return <NotFoundPage />;
  }

  useEffect(() => {
    const loadListing = async () => {
      const listing = await fetchListing(id);
      
      if (listing) {
        if (listing.dealer_id !== user?.id) {
          navigate('/my-listings');
          return;
        }
        
        setFormData({
          make: listing.make,
          model: listing.model,
          year: listing.year,
          vin: listing.vin || '',
          pdi_fee: listing.pdi_fee || 0,
          condition_notes: listing.condition_notes || '',
          status: listing.status as any,
          photo_url: listing.photo_url,
          location: listing.location || ''
        });
      }
    };

    loadListing();
  }, [id, user?.id, fetchListing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData || !id) return;

    try {
      // Convert pdi_fee to number if it's a string
      const updatedFormData = {
        ...formData,
        pdi_fee: typeof formData.pdi_fee === 'string' ? parseFloat(formData.pdi_fee) : formData.pdi_fee,
        year: typeof formData.year === 'string' ? parseInt(formData.year) : formData.year
      };

      await updateListing(id, updatedFormData);
      navigate('/my-listings');
    } catch (err) {
      // Error is handled by the store
      console.error('Error updating listing:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? ({
      ...prev,
      [name]: name === 'year' || name === 'pdi_fee' ? Number(value) : value,
    }) : null);
  };

  const handlePhotoChange = (url: string | null) => {
    setFormData(prev => prev ? ({
      ...prev,
      photo_url: url
    }) : null);
  };

  if (loading && !formData) {
    return <LoadingSpinner />;
  }

  if (!formData) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p>Listing not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <PhotoUpload
          onPhotoChange={handlePhotoChange}
          currentPhotoUrl={formData.photo_url}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Make
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min={1900}
              max={new Date().getFullYear() + 1}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
              VIN
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label htmlFor="pdi_fee" className="block text-sm font-medium text-gray-700">
              PDI Fee
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="pdi_fee"
                name="pdi_fee"
                value={formData.pdi_fee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="cancelled">Cancelled</option>
              <option value="searching">Searching</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="condition_notes" className="block text-sm font-medium text-gray-700">
            Condition Notes
          </label>
          <textarea
            id="condition_notes"
            name="condition_notes"
            value={formData.condition_notes}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 p-3 rounded-md">
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/my-listings')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}