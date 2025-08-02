import { useImageUpload } from "@/src/hooks/useImageUpload";
import { isLocalFileUri } from "@/src/utils/imageUpload";
import * as ImagePickerLib from "expo-image-picker";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    View
} from "react-native";
import { OptimizedImage } from "./OptimizedImage";

interface AvatarPickerProps {
  currentAvatar?: string;
  onAvatarChange: (url: string) => void;
  size?: number;
  bucket?: string;
  folder?: string;
}

export const AvatarPicker = ({
  currentAvatar,
  onAvatarChange,
  size = 96,
  bucket = "images",
  folder = "avatars",
}: AvatarPickerProps) => {
  const [uploading, setUploading] = useState(false);
  const { uploadSingle } = useImageUpload({
    bucket,
    folder,
    autoUpload: true,
    showToasts: true,
  });

  const pickImage = async () => {
    // Show option to choose between camera and gallery
    Alert.alert("Change Avatar", "Choose an option", [
      {
        text: "Camera",
        onPress: () => openCamera(),
      },
      {
        text: "Photo Library",
        onPress: () => openGallery(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const openCamera = async () => {
    // Request camera permissions
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

    if (!result.canceled) {
      await handleImageResult(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    // Request media library permissions
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
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      await handleImageResult(result.assets[0].uri);
    }
  };

  const handleImageResult = async (uri: string) => {
    if (!isLocalFileUri(uri)) {
      onAvatarChange(uri);
      return;
    }

    setUploading(true);

    try {
      const uploadResult = await uploadSingle(uri);

      if (uploadResult.success && uploadResult.url) {
        onAvatarChange(uploadResult.url);
      } else {
        Alert.alert(
          "Upload Failed",
          uploadResult.error || "Failed to upload image. Please try again."
        );
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="items-center">
      <TouchableOpacity
        onPress={pickImage}
        activeOpacity={0.7}
        disabled={uploading}
      >
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
          <OptimizedImage
            source={{
              uri: currentAvatar || "https://randomuser.me/api/portraits/men/32.jpg",
            }}
            style={{ width: size, height: size }}
            fallbackText="User"
          />
        </View>
        <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Camera size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};
