import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { optimizeImage, validateImage } from '../lib/imageLoader';

type PhotoUploadProps = {
  onPhotoChange: (url: string | null) => void;
  currentPhotoUrl?: string | null;
  label?: string;
  type?: 'vehicle' | 'logo';
};

export default function PhotoUpload({ 
  onPhotoChange, 
  currentPhotoUrl,
  label = 'Photo',
  type = 'vehicle'
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file
      await validateImage(file);

      // Optimize image
      const optimizedFile = await optimizeImage(file);

      // Generate a secure random filename
      const randomString = crypto.randomUUID();
      const fileName = `${randomString}.webp`;
      const filePath = `${type === 'vehicle' ? 'photos' : 'logos'}/${fileName}`;

      // Delete old photo if it exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('listings')
            .remove([`${type === 'vehicle' ? 'photos' : 'logos'}/${oldPath}`]);
        }
      }

      // Upload new photo
      const { error: uploadError, data } = await supabase.storage
        .from('listings')
        .upload(filePath, optimizedFile, {
          cacheControl: '31536000',
          upsert: false,
          contentType: 'image/webp',
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percentage));
          }
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);

      onPhotoChange(publicUrl);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      onPhotoChange(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhotoUrl) return;

    try {
      setUploading(true);
      setError(null);
      
      const photoPath = currentPhotoUrl.split('/').pop();
      if (photoPath) {
        const { error: deleteError } = await supabase.storage
          .from('listings')
          .remove([`${type === 'vehicle' ? 'photos' : 'logos'}/${photoPath}`]);

        if (deleteError) throw deleteError;
      }
      onPhotoChange(null);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {currentPhotoUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Remove {type === 'vehicle' ? 'Photo' : 'Logo'}
          </button>
        )}
      </div>

      {currentPhotoUrl ? (
        <div className="relative w-full h-48">
          <picture>
            <source srcSet={currentPhotoUrl} type="image/webp" />
            <img
              src={currentPhotoUrl}
              alt={type === 'vehicle' ? 'Vehicle' : 'Dealer Logo'}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer ${
              uploading ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">JPG, PNG, or WebP up to 5MB</p>
              <p className="text-xs text-gray-500 mt-1">Minimum size: 200x200 pixels</p>
            </div>
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Uploading... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}