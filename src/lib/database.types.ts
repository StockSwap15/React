type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
          dealer_name: string | null
          phone: string | null
          address: string | null
          alternate_phone: string | null
          fax: string | null
          website: string | null
          business_hours: string | null
          dealer_logo_url: string | null
          brands: string[]
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
          dealer_name?: string | null
          phone?: string | null
          address?: string | null
          alternate_phone?: string | null
          fax?: string | null
          website?: string | null
          business_hours?: string | null
          dealer_logo_url?: string | null
          brands?: string[]
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
          dealer_name?: string | null
          phone?: string | null
          address?: string | null
          alternate_phone?: string | null
          fax?: string | null
          website?: string | null
          business_hours?: string | null
          dealer_logo_url?: string | null
          brands?: string[]
        }
      }
      // ... other table definitions remain unchanged
    }
  }
}