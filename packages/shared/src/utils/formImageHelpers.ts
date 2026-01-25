import { Platform } from 'react-native';
import { processImageUris, removeLocalImages } from './imageUpload';

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
      onError('Image Processing Failed', "Some images couldn't be uploaded. Please try again.");
    }
    return removeLocalImages(images);
  }
}

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

export function validateImageUrls(images: string[]): string[] {
  return images.filter((url) => {
    if (!url) return false;

    if (url.startsWith('file://') || url.startsWith('content://')) return true;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

export function getImageSizeEstimate(
  uri: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!uri.startsWith('http')) {
      resolve(null);
      return;
    }

    if (Platform.OS !== 'web') {
      resolve(null);
      return;
    }

    const img = new (globalThis as any).Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

export default {
  processFormImages,
  processMultipleImageFields,
  validateImageUrls,
  getImageSizeEstimate,
};
