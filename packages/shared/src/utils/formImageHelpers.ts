import { processImageUris, removeLocalImages } from './imageUpload';

/**
 * Form helper to process images before submission
 * This ensures all local images are uploaded before form submission
 */
export async function processFormImages(
  images: string[],
  bucket: string = 'images',
  folder: string = 'user-uploads',
  onError?: (title: string, message: string) => void
): Promise<string[]> {
  try {
    const processedImages = await processImageUris(images, bucket, folder);
    return processedImages;
  } catch (error) {
    console.error('Error processing form images:', error);
    if (onError) {
      onError('❌ Image Processing Failed', "Some images couldn't be uploaded. Please try again.");
    }
    // Return only remote images, filter out any local ones
    return removeLocalImages(images);
  }
}

/**
 * Batch process multiple image arrays (useful for forms with multiple image fields)
 */
export async function processMultipleImageFields(
  imageFields: { [key: string]: string[] },
  bucket: string = 'images',
  folder: string = 'user-uploads'
): Promise<{ [key: string]: string[] }> {
  const processedFields: { [key: string]: string[] } = {};

  for (const [fieldName, images] of Object.entries(imageFields)) {
    if (images && images.length > 0) {
      processedFields[fieldName] = await processFormImages(
        images,
        bucket,
        `${folder}/${fieldName}`
      );
    } else {
      processedFields[fieldName] = [];
    }
  }

  return processedFields;
}

/**
 * Helper to validate image URLs and remove any invalid ones
 */
export function validateImageUrls(images: string[]): string[] {
  return images.filter((url) => {
    if (!url) return false;

    // Check if it's a valid local file URI
    if (url.startsWith('file://') || url.startsWith('content://')) {
      return true;
    }

    // Check if it's a valid HTTP(S) URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Helper to get image file size estimate (for display purposes)
 * Note: This only works for HTTP URLs and in web environments
 */
export function getImageSizeEstimate(
  uri: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!uri.startsWith('http')) {
      resolve(null);
      return;
    }

    // Check if we're in a web environment
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = uri;
  });
}

export default {
  processFormImages,
  processMultipleImageFields,
  validateImageUrls,
  getImageSizeEstimate,
};
