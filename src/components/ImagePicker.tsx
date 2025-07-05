
import * as ImagePickerLib from "expo-image-picker";
import { Plus } from "lucide-react-native"; // or any plus icon you use
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ImagePicker({ value, onChange }: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const images = value || [];

  const pickImage = async (replaceIdx?: number) => {
    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (replaceIdx !== undefined) {
        const newImages = [...images];
        newImages[replaceIdx] = uri;
        onChange(newImages);
      } else {
        onChange([...images, uri]);
      }
    }
  };

  // Show up to 4 slots
  const slots = Array.from({ length: 4 }, (_, i) => images[i] || null);

  return (
    <View className="mb-4">
      <Text className="text-white font-semibold mb-2">Images</Text>
      <View className="flex-row">
        {slots.map((img, idx) => (
          <TouchableOpacity
            key={idx}
            className="w-20 h-20 bg-surface rounded-lg mr-3 items-center justify-center border border-borderGray"
            onPress={() => pickImage(img ? idx : undefined)}
            activeOpacity={0.8}
          >
            {img ? (
              <Image
                source={{ uri: img }}
                style={{ width: 72, height: 72, borderRadius: 8 }}
              />
            ) : (
              <Plus size={32} color="#6366F1" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 