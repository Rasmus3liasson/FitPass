import * as ImagePickerLib from "expo-image-picker";
import { Image as ImageIcon } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ClubAvatarSectionProps {
  clubName: string;
  photos: string[];
  onAvatarChange: (newPhotos: string[]) => void;
}

export const ClubAvatarSection: React.FC<ClubAvatarSectionProps> = ({
  clubName,
  photos,
  onAvatarChange,
}) => {
  const handleAvatarChange = async () => {
    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      onAvatarChange([uri, ...photos.slice(1)]);
    }
  };

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        className="mb-2"
        activeOpacity={0.7}
        onPress={handleAvatarChange}
      >
        {photos[0] ? (
          <Image
            source={{ uri: photos[0] }}
            style={{ 
              width: 120, 
              height: 120, 
              borderRadius: 60,
              borderWidth: 4,
              borderColor: "#6366F1"
            }}
          />
        ) : (
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#374151",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 4,
              borderColor: "#6366F1",
            }}
          >
            <Text className="text-white text-4xl font-bold">
              {clubName?.[0]?.toUpperCase() || "C"}
            </Text>
          </View>
        )}
        <View className="absolute bottom-0 right-0 bg-primary p-3 rounded-full">
          <ImageIcon size={16} color="white" />
        </View>
      </TouchableOpacity>
      <Text className="text-textSecondary text-sm text-center mt-2">
        Tap to change club photo
      </Text>
    </View>
  );
};
