import { useFeedback } from '../hooks/useFeedback';
import {
  ImageUploadResult,
  processImageUris,
  uploadImageToSupabase,
  uploadMultipleImages,
} from '../utils/imageUpload';
import { useState } from 'react';

export interface UseImageUploadOptions {
  bucket?: string;
  folder?: string;
  autoUpload?: boolean;
  showToasts?: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    bucket = 'images',
    folder = 'user-uploads',
    autoUpload = true,
    showToasts = true,
  } = options;

  const { showSuccess, showError } = useFeedback();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: boolean;
  }>({});

  const uploadSingle = async (uri: string): Promise<ImageUploadResult> => {
    setUploading(true);

    try {
      const result = await uploadImageToSupabase(uri, bucket, folder);

      if (showToasts) {
        if (result.success) {
          showSuccess('Bild har laddats upp');
        } else {
          showError('Misslyckades ladda upp bilden');
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Misslyckades ladda upp bilden';

      if (showToasts) {
        showError('Misslyckades ladda upp bilden', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (uris: string[]): Promise<ImageUploadResult[]> => {
    setUploading(true);

    try {
      const results = await uploadMultipleImages(uris, bucket, folder);

      if (showToasts) {
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        if (failCount === 0) {
          showSuccess('Alla bilder har laddats upp', `Lyckades ladda upp ${successCount} bilder`);
        } else if (successCount === 0) {
          showError('Misslyckades ladda upp bilder', `Misslyckades ladda upp ${failCount} bilder`);
        } else {
          showError(
            '⚠️ Delvis uppladdning',
            `${successCount} uppladdade, ${failCount} misslyckades`
          );
        }
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Misslyckades ladda upp bilden';

      if (showToasts) {
        showError('❌ Misslyckades ladda upp bilden', errorMessage);
      }

      return uris.map(() => ({
        success: false,
        error: errorMessage,
      }));
    } finally {
      setUploading(false);
    }
  };

  const processUris = async (uris: string[]): Promise<string[]> => {
    setUploading(true);

    try {
      const processedUris = await processImageUris(uris, bucket, folder);

      if (showToasts) {
        const uploadedCount = uris.filter(
          (uri) => uri.startsWith('file://') || uri.startsWith('content://')
        ).length;

        if (uploadedCount > 0) {
          showSuccess(
            'Bilder har bearbetats',
            `${uploadedCount} bilder har laddats upp och bearbetats`
          );
        }
      }

      return processedUris;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bearbetning misslyckades';

      if (showToasts) {
        showError('Bearbetningsfel', errorMessage);
      }

      return uris;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadSingle,
    uploadMultiple,
    processUris,
    uploading,
    uploadProgress,
    setUploadProgress,
  };
}
