import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className = '', 
  size = 'md', 
  center = true 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 
        className={`text-blue-600 animate-spin ${sizeClasses[size]} ${className}`} 
        aria-hidden="true"
      />
      <span className="sr-only">Loading</span>
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {spinner}
      </div>
    );
  }

  return spinner;
};

