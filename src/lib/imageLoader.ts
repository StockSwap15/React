export async function optimizeImage(file: File): Promise<File> {
  // Check if the browser supports the required APIs
  if (!window.createImageBitmap || !window.OffscreenCanvas) {
    return file;
  }

  try {
    // Create an image bitmap from the file
    const bitmap = await createImageBitmap(file);

    // Create an offscreen canvas
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Draw the image to the canvas
    ctx.drawImage(bitmap, 0, 0);

    // Convert to WebP with quality settings
    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.8
    });

    // Create a new file with the optimized blob
    return new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
      type: 'image/webp'
    });
  } catch (error) {
    console.warn('Image optimization failed:', error);
    return file;
  }
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function validateImage(file: File, options = { maxSize: 5 * 1024 * 1024, minWidth: 200, minHeight: 200 }) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP file');
  }

  if (file.size > options.maxSize) {
    throw new Error(`File size must be less than ${options.maxSize / (1024 * 1024)}MB`);
  }

  return getImageDimensions(file).then(({ width, height }) => {
    if (width < options.minWidth || height < options.minHeight) {
      throw new Error(`Image dimensions must be at least ${options.minWidth}x${options.minHeight} pixels`);
    }
    return true;
  });
}