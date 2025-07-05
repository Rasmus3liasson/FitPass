import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const AMENITIES = [
  "wifi",
  "showers",
  "lockers",
  "sauna",
  "parking",
  "pool",
  "towels",
  "personal trainer",
  "group classes",
  "cafe",
  "shop",
];

export default function AmenitiesSelector({ value, onChange }: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const selected = value || [];
  const toggle = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter(a => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };
  return (
    <View className="mb-4">
      <Text className="text-white font-semibold mb-2">Amenities</Text>
      <View className="flex-row flex-wrap">
        {AMENITIES.map((amenity) => (
          <TouchableOpacity
            key={amenity}
            className={`px-3 py-1 rounded-full mr-2 mb-2 ${selected.includes(amenity) ? "bg-primary" : "bg-surface border border-borderGray"}`}
            onPress={() => toggle(amenity)}
          >
            <Text className={`text-sm ${selected.includes(amenity) ? "text-white" : "text-textSecondary"}`}>{amenity}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 