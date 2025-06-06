import { z } from 'zod';

const profileSchema = z.object({
  dealer_name: z.string().min(1, 'Dealer name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  brands: z.array(z.string()).default([])
});

export const listingSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  vin: z.string().optional(),
  pdi_fee: z.number().min(0, 'PDI fee cannot be negative').optional(),
  condition_notes: z.string().optional(),
  photo_url: z.string().url().optional().nullable(),
  location: z.string().optional()
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty')
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ListingFormData = z.infer<typeof listingSchema>;
type MessageFormData = z.infer<typeof messageSchema>;