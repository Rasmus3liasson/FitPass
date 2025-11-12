import { supabase } from '@/src/lib/integrations/supabase/supabaseClient';
import { testImageUrl } from './imageUtils';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Note: Storage bucket creation removed due to RLS policy restrictions
// The 'images' bucket should be created manually in Supabase dashboard

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI from image picker
 * @param bucket - Storage bucket name (default: 'images')
 * @param folder - Optional folder path within bucket
 * @returns Promise with upload result
 */
export async function uploadImageToSupabase(
  uri: string,
  bucket: string = 'images',
  folder?: string
): Promise<ImageUploadResult> {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication required for storage upload:', authError);
      return {
        success: false,
        error: 'Authentication required. Please log in to upload images.'
      };
    }

    // Generate unique filename with user-specific path
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Create user-specific folder path for RLS compliance
    const userFolder = `user-${user.id}`;
    const fullFolder = folder ? `${userFolder}/${folder}` : userFolder;
    const filePath = `${fullFolder}/${fileName}`;

    // Use fetch to get the file as ArrayBuffer (works reliably in RN)
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    // Upload to Supabase Storage with ArrayBuffer
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('row-level security policy')) {
        errorMessage = 'Upload permissions denied. Please check your storage bucket configuration.';
      } else if (error.message.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please ensure the "images" bucket exists in your Supabase project.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'File already exists. Please try again.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    // Return the clean public URL without modifications
    const finalUrl = publicUrlData.publicUrl;

    // Test the URL accessibility in development
    if (__DEV__) {
      setTimeout(() => testImageUrl(finalUrl), 1000);
    }

    return {
      success: true,
      url: finalUrl
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload multiple images to Supabase Storage
 * @param uris - Array of local file URIs
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImages(
  uris: string[],
  bucket: string = 'images',
  folder?: string
): Promise<ImageUploadResult[]> {
  const uploadPromises = uris.map(uri => 
    uploadImageToSupabase(uri, bucket, folder)
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image
 * @param bucket - Storage bucket name
 * @returns Promise with deletion result
 */
export async function deleteImageFromSupabase(
  url: string,
  bucket: string = 'images'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      return {
        success: false,
        error: 'Invalid image URL'
      };
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Check if a URI is a local file or already uploaded
 * @param uri - Image URI to check
 * @returns boolean indicating if it's a local file
 */
export function isLocalFileUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

/**
 * Filter out local file URIs from an array of image URIs
 * @param uris - Array of image URIs
 * @returns Array with only remote URLs
 */
export function removeLocalImages(uris: string[]): string[] {
  return uris.filter(uri => !isLocalFileUri(uri));
}

/**
 * Process image URIs - upload local files and return only remote URLs
 * @param uris - Array of image URIs (mix of local and remote)
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path
 * @returns Promise with processed URLs (local files removed if upload fails)
 */
export async function processImageUris(
  uris: string[],
  bucket: string = 'images',
  folder?: string
): Promise<string[]> {
  const processedUris: string[] = [];

  for (const uri of uris) {
    if (isLocalFileUri(uri)) {
      // Upload local file
      const result = await uploadImageToSupabase(uri, bucket, folder);
      if (result.success && result.url) {
        processedUris.push(result.url);
      } else {
        console.warn('Failed to upload image:', result.error);
        // Skip local URIs that fail to upload - don't save them
      }
    } else {
      // Keep remote URL as is
      processedUris.push(uri);
    }
  }

  return processedUris;
}
