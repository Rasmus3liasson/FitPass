import { useImageUpload } from "../hooks/useImageUpload";
import * as ImagePickerLib from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
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

  const auth = useAuth();
  const { data: userProfile } = useUserProfile(auth.user?.id || "");

  const handleAvatarPress = async () => {
    setUploading(true);
    
    try {
      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        // Upload the image using your ImagePicker's upload logic
        const uploadResult = await uploadSingle(uri);

        if (uploadResult.success && uploadResult.url) {
          onAvatarChange(uploadResult.url);
        } else {
          console.warn('Upload failed:', uploadResult.error);
        }
      }
    } catch (error) {
      console.error('Avatar selection error:', error);
    } finally {
      setUploading(false);
    }
  };

  const currentAvatarUrl = currentAvatar || userProfile?.avatar_url;

  return (
    <View className="items-center">
      <TouchableOpacity
        onPress={handleAvatarPress}
        activeOpacity={0.7}
        disabled={uploading}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
          }}
        >
          <OptimizedImage
            source={{
              uri: currentAvatarUrl,
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
