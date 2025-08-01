import {
    ImageUploadResult,
    processImageUris,
    uploadImageToSupabase,
    uploadMultipleImages,
} from "@/src/utils/imageUpload";
import { useState } from "react";
import Toast from "react-native-toast-message";

export interface UseImageUploadOptions {
  bucket?: string;
  folder?: string;
  autoUpload?: boolean;
  showToasts?: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    bucket = "images",
    folder = "user-uploads",
    autoUpload = true,
    showToasts = true,
  } = options;

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
          Toast.show({
            type: "success",
            text1: "✅ Image Uploaded",
            text2: "Your image has been uploaded successfully!",
            position: "top",
            visibilityTime: 2000,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "❌ Upload Failed",
            text2: result.error || "Failed to upload image",
            position: "top",
            visibilityTime: 3000,
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      if (showToasts) {
        Toast.show({
          type: "error",
          text1: "❌ Upload Error",
          text2: errorMessage,
          position: "top",
          visibilityTime: 3000,
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (
    uris: string[]
  ): Promise<ImageUploadResult[]> => {
    setUploading(true);

    try {
      const results = await uploadMultipleImages(uris, bucket, folder);

      if (showToasts) {
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        if (failCount === 0) {
          Toast.show({
            type: "success",
            text1: "✅ All Images Uploaded",
            text2: `Successfully uploaded ${successCount} images`,
            position: "top",
            visibilityTime: 2000,
          });
        } else if (successCount === 0) {
          Toast.show({
            type: "error",
            text1: "❌ Upload Failed",
            text2: `Failed to upload ${failCount} images`,
            position: "top",
            visibilityTime: 3000,
          });
        } else {
          Toast.show({
            type: "info",
            text1: "⚠️ Partial Upload",
            text2: `${successCount} uploaded, ${failCount} failed`,
            position: "top",
            visibilityTime: 3000,
          });
        }
      }

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";

      if (showToasts) {
        Toast.show({
          type: "error",
          text1: "❌ Upload Error",
          text2: errorMessage,
          position: "top",
          visibilityTime: 3000,
        });
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
          (uri) => uri.startsWith("file://") || uri.startsWith("content://")
        ).length;

        if (uploadedCount > 0) {
          Toast.show({
            type: "success",
            text1: "✅ Images Processed",
            text2: `${uploadedCount} images uploaded and processed`,
            position: "top",
            visibilityTime: 2000,
          });
        }
      }

      return processedUris;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Processing failed";

      if (showToasts) {
        Toast.show({
          type: "error",
          text1: "❌ Processing Error",
          text2: errorMessage,
          position: "top",
          visibilityTime: 3000,
        });
      }

      return uris; // Return original URIs on error
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
