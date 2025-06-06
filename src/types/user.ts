export interface AppUser {
  id: string;
  email: string;
  role: 'pending' | 'dealer' | 'admin';
  created_at: string;
  updated_at: string;
  dealer_name: string | null;
  phone: string | null;
  address: string | null;
  alternate_phone: string | null;
  fax: string | null;
  website: string | null;
  business_hours: string | null;
  dealer_logo_url: string | null;
  brands: string[];
}

type User = AppUser;

interface Profile {
  id: string;
  email: string;
  role: 'pending' | 'dealer' | 'admin';
  created_at: string;
  updated_at: string;
  dealer_name: string | null;
  phone: string | null;
  address: string | null;
  alternate_phone: string | null;
  fax: string | null;
  website: string | null;
  business_hours: string | null;
  dealer_logo_url: string | null;
  brands: string[];
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  created_by: string | null;
}

export interface UserFormData {
  dealer_name?: string;
  phone?: string | null;
  address?: string | null;
  brands?: string[];
}

interface AppUserFormData {
  dealer_name?: string;
  phone?: string | null;
  address?: string | null;
  brands?: string[];
  role?: 'pending' | 'dealer' | 'admin';
}

interface InviteFormData {
  email: string;
}