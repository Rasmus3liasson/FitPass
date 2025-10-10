import colors from "@/src/constants/custom-colors";
import { City } from "@/src/hooks/useCities";
import React from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

interface LocationModalProps {
  isVisible: boolean;
  cities: City[];
  citiesLoading: boolean;
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  onUseCurrentLocation: () => void;
  onClose: () => void;
}

export const LocationModal = ({
  isVisible,
  cities,
  citiesLoading,
  selectedCity,
  onCitySelect,
  onUseCurrentLocation,
  onClose
}: LocationModalProps) => {
  if (!isVisible) return null;

  return (
    <TouchableOpacity 
      className="absolute inset-0 justify-center items-center z-50 bg-black/50"
      activeOpacity={1}
      onPress={onClose}
    >
      <TouchableOpacity 
        className="bg-surface rounded-3xl mx-6 p-8 w-[90%] max-w-md shadow-2xl"
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <Text className="text-textPrimary text-2xl font-bold mb-6 text-center">
          Choose Location
        </Text>
        
        {/* Current Location Button */}
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center mb-6 shadow-sm"
          onPress={onUseCurrentLocation}
        >
          <Text className="text-textPrimary font-semibold text-base">Use Current Location</Text>
        </TouchableOpacity>
        
        {/* Cities List */}
        <Text className="text-textSecondary text-base mb-4 font-medium">Or choose a city:</Text>
        
        {citiesLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-textSecondary text-sm mt-3">Loading cities...</Text>
          </View>
        ) : (
          <FlatList
            data={cities}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            className="max-h-72 mb-6"
            renderItem={({ item: city }) => (
              <TouchableOpacity
                className={`py-4 px-5 rounded-2xl mb-3 border-2 ${
                  selectedCity?.id === city.id 
                    ? 'bg-primary/10 border-primary shadow-sm' 
                    : 'bg-surface border-accentGray/30'
                }`}
                onPress={() => onCitySelect(city)}
              >
                <View className="flex-row justify-between items-center">
                  <Text className={`font-semibold text-base ${
                    selectedCity?.id === city.id 
                      ? 'text-primary' 
                      : 'text-textPrimary'
                  }`}>
                    {city.name}
                  </Text>
                  <View className="bg-accentGray/50 px-3 py-1 rounded-full">
                    <Text className="text-textSecondary text-xs font-medium">
                      {city.clubCount} {city.clubCount === 1 ? 'gym' : 'gyms'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
        
        <TouchableOpacity
          className="bg-accentGray/30 rounded-2xl py-4 items-center border border-accentGray/50"
          onPress={onClose}
        >
          <Text className="text-textSecondary font-semibold text-base">Cancel</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
