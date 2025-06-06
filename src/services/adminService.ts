import { supabase } from '../lib/supabase';
import { withTimeout, retryWithBackoff } from '../utils/errors';
import type { AppUser, Invitation, AppUserFormData, InviteFormData } from '../types/admin';
import { z } from 'zod';

// Define validation schemas
const appUserFormSchema = z.object({
  dealer_name: z.string().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  brands: z.array(z.string()).optional(),
  role: z.enum(['pending', 'dealer', 'admin']).optional()
});

const inviteFormSchema = z.object({
  email: z.string().email('Invalid email format')
});

/**
 * Fetch all users
 */
export async function fetchUsers(): Promise<AppUser[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at, dealer_name, phone, address, brands')
        .order('created_at', { ascending: false }),
      30000,
      'Users fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch pending users
 */
async function fetchPendingUsers(): Promise<AppUser[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at, dealer_name, phone, address, brands')
        .eq('role', 'pending')
        .order('created_at', { ascending: false }),
      30000,
      'Pending users fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all invitations
 */
export async function fetchInvitations(): Promise<Invitation[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('invitations')
        .select('id, email, token, created_at, expires_at, used_at, created_by')
        .order('created_at', { ascending: false }),
      30000,
      'Invitations fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return data || [];
}

/**
 * Update a user
 */
export async function updateUser(id: string, updates: AppUserFormData): Promise<void> {
  // Validate input data
  const validatedUpdates = appUserFormSchema.parse(updates);

  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('profiles')
        .update(validatedUpdates)
        .eq('id', id),
      30000,
      'User update timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Approve a user (change role from pending to dealer)
 */
export async function approveUser(id: string): Promise<void> {
  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('profiles')
        .update({ role: 'dealer' })
        .eq('id', id),
      30000,
      'User approval timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Reject a user (deactivate account)
 */
export async function rejectUser(id: string): Promise<void> {
  // In this system, rejecting means setting role back to pending
  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('profiles')
        .update({ role: 'pending' })
        .eq('id', id),
      30000,
      'User rejection timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Create an invitation
 */
export async function createInvitation(data: InviteFormData, createdBy?: string): Promise<Invitation> {
  // Validate input data
  const validatedData = inviteFormSchema.parse(data);

  // Generate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Generate a random token
  const token = crypto.randomUUID();

  const { data: invite, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('invitations')
        .insert({
          email: validatedData.email,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: createdBy
        })
        .select('id, email, token, created_at, expires_at, used_at, created_by')
        .single(),
      30000,
      'Invitation creation timed out'
    );
  }, 5);

  if (error) throw error;
  return invite;
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(id: string): Promise<void> {
  const { error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('invitations')
        .delete()
        .eq('id', id),
      30000,
      'Invitation deletion timed out'
    );
  }, 5);

  if (error) throw error;
}

/**
 * Fetch available vehicle brands
 */
export async function fetchVehicleBrands(): Promise<{ id: string, name: string }[]> {
  const { data, error } = await retryWithBackoff(async () => {
    return await withTimeout(
      supabase
        .from('vehicle_brands')
        .select('id, name')
        .order('name'),
      30000,
      'Brands fetch timed out'
    );
  }, 5);

  if (error) throw error;
  return data || [];
}