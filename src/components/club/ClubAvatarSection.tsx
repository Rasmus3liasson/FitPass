import { useImageUpload } from "@/src/hooks/useImageUpload";
import { updateClub } from "@/src/lib/integrations/supabase/queries/clubQueries";
import { isLocalFileUri } from "@/src/utils/imageUpload";
import * as ImagePickerLib from "expo-image-picker";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OptimizedImage } from "../OptimizedImage";

interface ClubAvatarSectionProps {
  clubName: string;
  photos: string[];
  onAvatarChange: (newPhotos: string[]) => void;
  clubId?: string; // Optional: for auto-saving to database
  autoSave?: boolean; // Optional: enable auto-save
}

export const ClubAvatarSection: React.FC<ClubAvatarSectionProps> = ({
  clubName,
  photos,
  onAvatarChange,
  clubId,
  autoSave = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const { uploadSingle } = useImageUpload({
    bucket: "images",
    folder: "clubs",
    autoUpload: true,
    showToasts: true,
  });

  const handleAvatarChange = async () => {
    // Show option to choose between camera and gallery
    Alert.alert("Change Club Photo", "Choose an option", [
      {
        text: "Kamera",
        onPress: () => openCamera(),
      },
      {
        text: "Bibliotek",
        onPress: () => openGallery(),
      },
      {
        text: "Avbryt",
        style: "cancel",
      },
    ]);
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePickerLib.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera permissions to take a photo."
        );
        return;
      }

      const result = await ImagePickerLib.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleImageResult(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const openGallery = async () => {
    try {
      const { status } =
        await ImagePickerLib.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need photo library permissions to select a photo."
        );
        return;
      }

      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleImageResult(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open photo library. Please try again.");
    }
  };

  const handleImageResult = async (uri: string) => {
    if (!isLocalFileUri(uri)) {
      // If it's already a remote URL, use it directly
      const newPhotos = [uri, ...photos.slice(1)];
      onAvatarChange(newPhotos);

      // Auto-save to database if enabled
      if (autoSave && clubId) {
        try {
          await updateClub(clubId, { photos: newPhotos });
        } catch (error) {
          console.error("Club photo auto-save error:", error);
        }
      }
      return;
    }

    setUploading(true);

    try {
      const uploadResult = await uploadSingle(uri);

      if (uploadResult.success && uploadResult.url) {
        // Replace the first photo (avatar) with the uploaded URL
        const newPhotos = [uploadResult.url, ...photos.slice(1)];
        onAvatarChange(newPhotos);

        // Auto-save to database if enabled
        if (autoSave && clubId) {
          try {
            await updateClub(clubId, { photos: newPhotos });
          } catch (error) {
            console.error("Club photo auto-save error:", error);
          }
        }
      } else {
        Alert.alert(
          "Upload Failed",
          uploadResult.error || "Failed to upload image. Please try again."
        );
      }
    } catch (error) {
      console.error("Club avatar upload error:", error);
      Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        className="mb-2"
        activeOpacity={0.7}
        onPress={handleAvatarChange}
        disabled={uploading}
      >
        {photos[0] ? (
          <View>
            <OptimizedImage
              source={{ uri: photos[0] }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1,
                borderColor: "#6366F1",
              }}
            />
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 60,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="large" color="white" />
              </View>
            )}
          </View>
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#374151",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#6366F1",
            }}
          >
            {uploading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Text className="text-textPrimary text-4xl font-bold">
                {clubName?.[0]?.toUpperCase() || "C"}
              </Text>
            )}
          </View>
        )}
        {!uploading && (
          <View className="absolute bottom-0 right-0 bg-primary p-3 rounded-full">
            <Camera size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
      <Text className="text-textSecondary text-sm text-center mt-2">
        {uploading ? "Laddar..." : "Tryck för att ändra klubbfoto"}
      </Text>
    </View>
  );
};
