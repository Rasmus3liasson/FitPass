import { supabase } from '../lib/integrations/supabase/supabaseClient';
import { Platform } from 'react-native';

/**
 * Utility to handle iOS Simulator image loading issues
 */
export const getOptimizedImageUrl = (url: string): string => {
  if (!url) return url;

  // For iOS Simulator, just add a simple cache busting parameter
  if (Platform.OS === 'ios' && __DEV__) {
    // Only add timestamp for cache busting - avoid format/quality params that Supabase doesn't support
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  return url;
};

/**
 * Get a simplified URL without query parameters (sometimes helps with iOS Simulator)
 */
export const getSimplifiedImageUrl = (url: string): string => {
  if (!url) return url;
  
  // Remove all query parameters
  return url.split('?')[0];
};

/**
 * Get a signed URL for better image loading on iOS Simulator
 */
export const getSignedImageUrl = async (path: string, bucket: string = 'images'): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      return getOptimizedImageUrl(publicData.publicUrl);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSignedImageUrl:', error);
    // Fallback to public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return getOptimizedImageUrl(publicData.publicUrl);
  }
};

/**
 * Check if we're running on iOS Simulator
 */
export const isIOSSimulator = (): boolean => {
  return Platform.OS === 'ios' && __DEV__;
};

/**
 * Debug function to test image URL accessibility
 */
export const testImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Image URL test failed for ${url}:`, error);
    return false;
  }
};
