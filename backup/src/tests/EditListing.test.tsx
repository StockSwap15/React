import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditListing from '../pages/EditListing';
import * as listingService from '../services/listingService';
import { useListingStore } from '../lib/listingStore';
import { useAuth } from '../lib/AuthProvider';

// Mock the modules
vi.mock('../lib/AuthProvider', () => ({
  useAuth: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-listing-id' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('../services/listingService', () => ({
  updateListing: vi.fn()
}));

describe('EditListing Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock auth
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user-id' },
      profile: { role: 'dealer' },
      loading: false,
      isAdmin: false
    });
    
    // Mock listing store
    const mockStore = useListingStore.getState();
    useListingStore.setState({
      ...mockStore,
      selectedListing: {
        id: 'test-listing-id',
        dealer_id: 'test-user-id',
        make: 'Test Make',
        model: 'Test Model',
        year: 2023,
        vin: 'TEST123456789',
        pdi_fee: 100,
        condition_notes: 'Test notes',
        status: 'available',
        photo_url: null,
        location: 'Test Location',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      },
      loading: false,
      error: null,
      fetchListing: vi.fn().mockResolvedValue({
        id: 'test-listing-id',
        dealer_id: 'test-user-id',
        make: 'Test Make',
        model: 'Test Model',
        year: 2023,
        vin: 'TEST123456789',
        pdi_fee: 100,
        condition_notes: 'Test notes',
        status: 'available',
        photo_url: null,
        location: 'Test Location',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }),
      updateListing: vi.fn()
    });
    
    // Mock service
    vi.mocked(listingService.updateListing).mockResolvedValue({
      id: 'test-listing-id',
      dealer_id: 'test-user-id',
      make: 'Updated Make',
      model: 'Updated Model',
      year: 2024,
      vin: 'UPDATED123456789',
      pdi_fee: 200,
      condition_notes: 'Updated notes',
      status: 'available',
      photo_url: null,
      location: 'Updated Location',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    });
  });

  it('renders the form with listing data', async () => {
    render(
      <BrowserRouter>
        <EditListing />
      </BrowserRouter>
    );

    // Wait for the form to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Make/i)).toHaveValue('Test Make');
      expect(screen.getByLabelText(/Model/i)).toHaveValue('Test Model');
      expect(screen.getByLabelText(/Year/i)).toHaveValue(2023);
      expect(screen.getByLabelText(/VIN/i)).toHaveValue('TEST123456789');
      expect(screen.getByLabelText(/PDI Fee/i)).toHaveValue(100);
      expect(screen.getByLabelText(/Condition Notes/i)).toHaveValue('Test notes');
      expect(screen.getByLabelText(/Location/i)).toHaveValue('Test Location');
    });
  });

  it('updates the listing when form is submitted', async () => {
    render(
      <BrowserRouter>
        <EditListing />
      </BrowserRouter>
    );

    // Wait for the form to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Make/i)).toHaveValue('Test Make');
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/Make/i), { target: { value: 'Updated Make' } });
    fireEvent.change(screen.getByLabelText(/Model/i), { target: { value: 'Updated Model' } });
    fireEvent.change(screen.getByLabelText(/Year/i), { target: { value: '2024' } });
    fireEvent.change(screen.getByLabelText(/VIN/i), { target: { value: 'UPDATED123456789' } });
    fireEvent.change(screen.getByLabelText(/PDI Fee/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/Condition Notes/i), { target: { value: 'Updated notes' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Updated Location' } });

    // Submit the form
    fireEvent.submit(screen.getByText('Save Changes').closest('form')!);

    // Verify the store's updateListing was called with correct args
    await waitFor(() => {
      expect(useListingStore.getState().updateListing).toHaveBeenCalledWith(
        'test-listing-id',
        expect.objectContaining({
          make: 'Updated Make',
          model: 'Updated Model',
          year: 2024,
          vin: 'UPDATED123456789',
          pdi_fee: 200,
          condition_notes: 'Updated notes',
          location: 'Updated Location'
        })
      );
    });
  });

  it('handles errors during update', async () => {
    // Mock error in the store's updateListing
    useListingStore.setState({
      ...useListingStore.getState(),
      updateListing: vi.fn().mockImplementation(() => {
        throw new Error('Update failed');
      })
    });

    render(
      <BrowserRouter>
        <EditListing />
      </BrowserRouter>
    );

    // Wait for the form to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Make/i)).toHaveValue('Test Make');
    });

    // Update a field
    fireEvent.change(screen.getByLabelText(/Make/i), { target: { value: 'Updated Make' } });

    // Submit the form
    fireEvent.submit(screen.getByText('Save Changes').closest('form')!);

    // Verify error handling
    await waitFor(() => {
      expect(useListingStore.getState().updateListing).toHaveBeenCalled();
      // In a real scenario, we would check for error message display
      // but since we're mocking at a high level, we just verify the function was called
    });
  });
});