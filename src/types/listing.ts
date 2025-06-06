type ListingStatus = 'available' | 'pending' | 'sold' | 'cancelled' | 'searching' | 'archived';

export interface Listing {
  id: string;
  dealer_id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  pdi_fee: number | null;
  condition_notes: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  location: string | null;
  photo_url: string | null;
  segment_id: string | null;
  model_id: string | null;
  model_code_id: string | null;
  expires_at?: string;
  dealer?: {
    dealer_name: string | null;
    phone: string | null;
    address: string | null;
    email: string;
  };
  model_codes?: {
    code: string;
  } | null;
}

export interface ListingFormData {
  make: string;
  model: string;
  year: number | null;
  vin?: string;
  pdi_fee?: number;
  condition_notes?: string;
  status?: ListingStatus;
  photo_url?: string | null;
  location?: string;
  segment_id?: string | null;
  model_id?: string | null;
  model_code_id?: string | null;
}

interface VehicleSegment {
  id: string;
  name: string;
  brand_id: string;
  created_at?: string;
  updated_at?: string;
}

interface VehicleModel {
  id: string;
  name: string;
  segment_id: string;
  created_at?: string;
  updated_at?: string;
}

interface ModelCode {
  id: string;
  code: string;
  year: number;
  model_id: string;
  created_at?: string;
  updated_at?: string;
}

interface VehicleBrand {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}