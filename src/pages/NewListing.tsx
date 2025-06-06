import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthProvider';
import PhotoUpload from '../components/PhotoUpload';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useVehicleData } from '../hooks/useVehicleData';
import { useListingStore } from '../lib/listingStore';

type ListingFormData = {
  make: string;
  model: string;
  year: number | null;
  vin: string;
  pdi_fee: number;
  condition_notes: string;
  location: string;
  photo_url: string | null;
  brand_id: string | null;
  segment_id: string | null;
  model_id: string | null;
  model_code_id: string | null;
};

const initialFormData: ListingFormData = {
  make: '',
  model: '',
  year: null,
  vin: '',
  pdi_fee: 0,
  condition_notes: '',
  location: '',
  photo_url: null,
  brand_id: null,
  segment_id: null,
  model_id: null,
  model_code_id: null
};

export default function NewListing() {
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createListing, loading, error, clearError } = useListingStore();

  const { segments, models, modelCodes, loading: vehicleDataLoading, error: vehicleDataError, fetchModels } = useVehicleData(
    formData.make,
    formData.year
  );

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('vehicle_brands')
        .select('id, name')
        .order('name');

      if (fetchError) throw fetchError;

      // Filter brands based on user's authorized brands
      const filteredBrands = profile?.role === 'admin' 
        ? data 
        : data?.filter(brand => profile?.brands?.includes(brand.name));

      setBrands(filteredBrands || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (!user) throw new Error('You must be logged in to create a listing');
      if (!formData.model_id) throw new Error('Please select a model');
      if (!formData.model_code_id) throw new Error('Please select a model code');

      const selectedModel = models.find(m => m.id === formData.model_id);
      if (!selectedModel) throw new Error('Invalid model selection');

      const newListing = {
        make: formData.make,
        model: selectedModel.name,
        year: formData.year,
        vin: formData.vin || null,
        pdi_fee: formData.pdi_fee || null,
        condition_notes: formData.condition_notes,
        location: formData.location,
        photo_url: formData.photo_url,
        status: 'available',
        segment_id: formData.segment_id,
        model_id: formData.model_id,
        model_code_id: formData.model_code_id
      };

      const result = await createListing(newListing);
      if (result) {
        navigate('/inventory');
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Error creating listing:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'make') {
      setFormData(prev => ({
        ...prev,
        make: value,
        segment_id: null,
        model_id: null,
        model_code_id: null
      }));
    } else if (name === 'segment_id') {
      setFormData(prev => ({
        ...prev,
        segment_id: value,
        model_id: null,
        model_code_id: null
      }));
      fetchModels(value);
    } else if (name === 'year') {
      setFormData(prev => ({
        ...prev,
        year: value ? Number(value) : null,
        model_id: null,
        model_code_id: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'pdi_fee' ? Number(value) : value,
      }));
    }
  };

  const handlePhotoChange = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      photo_url: url,
    }));
  };

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

  if (vehicleDataLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <PhotoUpload
          onPhotoChange={handlePhotoChange}
          currentPhotoUrl={formData.photo_url}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">
              Brand *
            </label>
            <select
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year *
            </label>
            <select
              id="year"
              name="year"
              value={formData.year || ''}
              onChange={handleChange}
              required
              disabled={!formData.make}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <label htmlFor="segment_id" className="block text-sm font-medium text-gray-700">
              Segment *
            </label>
            <select
              id="segment_id"
              name="segment_id"
              value={formData.segment_id || ''}
              onChange={handleChange}
              required
              disabled={!formData.year}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Segment</option>
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="model_id" className="block text-sm font-medium text-gray-700">
              Model *
            </label>
            <select
              id="model_id"
              name="model_id"
              value={formData.model_id || ''}
              onChange={handleChange}
              required
              disabled={!formData.segment_id || models.length === 0}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="model_code_id" className="block text-sm font-medium text-gray-700">
              Model Code *
            </label>
            <select
              id="model_code_id"
              name="model_code_id"
              value={formData.model_code_id || ''}
              onChange={handleChange}
              required
              disabled={!formData.model_id || modelCodes.length === 0}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Model Code</option>
              {modelCodes
                .filter(code => code.model_id === formData.model_id)
                .map(code => (
                  <option key={code.id} value={code.id}>
                    {code.code}
                  </option>
                ))}
            </select>
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

        {(error || vehicleDataError) && (
          <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error || vehicleDataError}</span>
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
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}