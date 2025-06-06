import React from 'react';
import { getStatusText, getStatusColorClass } from '../utils/listingUtils';
import type { Listing } from '../types/listing';

type ListingStatusProps = {
  listing: Listing;
  className?: string;
};

export default function ListingStatus({ listing, className = '' }: ListingStatusProps) {
  const statusText = getStatusText(listing);
  const colorClass = getStatusColorClass(listing);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {statusText}
    </span>
  );
}