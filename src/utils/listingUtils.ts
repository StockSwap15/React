import type { Listing } from '../types/listing';

export function getStatusText(listing: Listing): string {
  switch (listing.status) {
    case 'available':
      return 'Available';
    case 'pending':
      return 'Pending';
    case 'sold':
      return 'Sold';
    case 'cancelled':
      return 'Cancelled';
    case 'searching':
      return 'Searching';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

export function getStatusColorClass(listing: Listing): string {
  switch (listing.status) {
    case 'available':
      // Changed from emerald-600 to emerald-700 for better contrast
      return 'bg-emerald-700 text-white';
    case 'pending':
      return 'bg-amber-600 text-white';
    case 'sold':
      return 'bg-blue-700 text-white';
    case 'cancelled':
      return 'bg-red-700 text-white';
    case 'searching':
      return 'bg-purple-700 text-white';
    case 'archived':
      return 'bg-gray-700 text-white';
    default:
      return 'bg-gray-700 text-white';
  }
}