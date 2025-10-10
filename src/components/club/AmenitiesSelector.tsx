import { useAmenities } from "@/src/hooks/useAmenities";
import { Amenity } from "@/src/types";
import React, { useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

export const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenities,
  onAmenitiesChange,
}) => {
  const { data: amenities, isLoading } = useAmenities();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color="#6366F1" />
        <Text className="text-gray-400 mt-2">Loading amenities...</Text>
      </View>
    );
  }

  const selectedIds = new Set(selectedAmenities);
  const filtered = (amenities as Amenity[] ?? []).filter((a) => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (amenity: Amenity) => {
    const newSelected = [...selectedAmenities];
    const amenityName = amenity.name;
    
    if (selectedIds.has(amenityName)) {
      // Remove amenity
      const index = newSelected.indexOf(amenityName);
      if (index > -1) {
        newSelected.splice(index, 1);
      }
    } else {
      // Add amenity
      newSelected.push(amenityName);
    }
    
    onAmenitiesChange(newSelected);
  };

  // Show selected amenities at the top
  const selectedAmenityObjects = (amenities as Amenity[] ?? []).filter((a) => 
    selectedIds.has(a.name)
  );

  return (
    <View>
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Text className="text-primary text-lg">✨</Text>
        </View>
        <Text className="text-textPrimary text-lg font-semibold">Select Amenities</Text>
      </View>

      {/* Selected amenities section */}
      {selectedAmenityObjects.length > 0 && (
        <View className="mb-4">
          <Text className="text-textPrimary font-medium mb-2">
            Selected ({selectedAmenityObjects.length})
          </Text>
          <View className="flex-row flex-wrap">
            {selectedAmenityObjects.map((amenity) => (
              <TouchableOpacity
                key={`selected-${amenity.id}`}
                className="flex-row items-center bg-primary rounded-full px-3 py-2 mr-2 mb-2"
                onPress={() => toggle(amenity)}
              >
                {amenity.icon ? (
                  <Image 
                    source={{ uri: amenity.icon }} 
                    style={{ width: 16, height: 16, marginRight: 6 }} 
                  />
                ) : (
                  <View 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      marginRight: 6, 
                      backgroundColor: '#fff', 
                      borderRadius: 8 
                    }} 
                  />
                )}
                <Text className="text-textPrimary text-sm font-medium">{amenity.name}</Text>
                <Text className="text-textPrimary text-sm ml-2">×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search input */}
      <TextInput
        className="bg-background text-textPrimary rounded-xl px-4 py-3 mb-4 border border-gray-600"
        placeholder="Search amenities..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
      />

      {/* Available amenities */}
      <View>
        <Text className="text-textPrimary font-medium mb-2">Available Amenities</Text>
        <View className="flex-row flex-wrap">
          {filtered.map((amenity) => {
            const isSelected = selectedIds.has(amenity.name);
            return (
              <TouchableOpacity
                key={amenity.id}
                className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
                  isSelected 
                    ? "bg-primary/20 border-primary" 
                    : "bg-background border-gray-600"
                }`}
                onPress={() => toggle(amenity)}
              >
                {amenity.icon ? (
                  <Image 
                    source={{ uri: amenity.icon }} 
                    style={{ width: 16, height: 16, marginRight: 6 }} 
                  />
                ) : (
                  <View 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      marginRight: 6, 
                      backgroundColor: isSelected ? '#6366F1' : '#9CA3AF', 
                      borderRadius: 8 
                    }} 
                  />
                )}
                <Text 
                  className={`text-sm ${
                    isSelected ? "text-primary font-medium" : "text-textSecondary"
                  }`}
                >
                  {amenity.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {filtered.length === 0 && search && (
        <View className="py-8 items-center">
          <Text className="text-gray-400">No amenities found for "{search}"</Text>
        </View>
      )}
    </View>
  );
};
