
import * as ImagePickerLib from "expo-image-picker";
import { Plus, X } from "lucide-react-native"; // add X icon
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function ImagePicker({ value, onChange, fullWidth }: {
  value: string[];
  onChange: (val: string[]) => void;
  fullWidth?: boolean;
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

  // Show up to 6 slots (like Tinder)
  const slots = Array.from({ length: 6 }, (_, i) => images[i] || null);

  const handleRemove = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    onChange(newImages);
  };

  return (
    <View className="mb-4">
      <Text className="text-white font-semibold mb-2">Images</Text>
      <View className={fullWidth ? "flex-row w-full" : "flex-row flex-wrap"}>
        {slots.slice(0, 4).map((img, idx) => (
          <View
            key={idx}
            className={fullWidth ? "relative flex-1 aspect-square bg-surface rounded-lg mr-3 mb-0 items-center justify-center border border-borderGray" : "relative w-20 h-20 bg-surface rounded-lg mr-3 mb-3 items-center justify-center border border-borderGray"}
            style={fullWidth ? { maxWidth: undefined } : {}}
          >
            <TouchableOpacity
              style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}
              onPress={() => pickImage(img ? idx : undefined)}
              activeOpacity={0.8}
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  style={{ width: fullWidth ? "100%" : 72, height: fullWidth ? "100%" : 72, borderRadius: 8, flex: fullWidth ? 1 : undefined }}
                  resizeMode={fullWidth ? "cover" : "contain"}
                />
              ) : (
                <Plus size={32} color="#6366F1" />
              )}
            </TouchableOpacity>
            {img && (
              <TouchableOpacity
                style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10, padding: 2, zIndex: 1 }}
                onPress={() => handleRemove(idx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
} 