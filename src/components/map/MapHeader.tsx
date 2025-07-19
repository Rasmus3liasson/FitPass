import { BackButton } from "@/src/components/Button";
import colors from "@/src/constants/custom-colors";
import { City } from "@/src/hooks/useCities";
import { ChevronDown, Filter, MapPin } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MapHeaderProps {
  isLoadingLocation: boolean;
  isUsingCustomLocation: boolean;
  selectedCity: City | null;
  locationAddress?: string;
  onLocationPress: () => void;
}

export const MapHeader = ({
  isLoadingLocation,
  isUsingCustomLocation,
  selectedCity,
  locationAddress,
  onLocationPress
}: MapHeaderProps) => {
  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-background">
      <BackButton />
      <TouchableOpacity 
        className="flex-row items-center bg-surface rounded-full px-3 py-2 border border-primary space-x-2"
        onPress={onLocationPress}
      >
        <MapPin size={16} color={colors.primary} />
        <Text className="text-textPrimary text-sm font-medium max-w-[120px]" numberOfLines={1}>
          {isUsingCustomLocation && selectedCity
            ? selectedCity.name
            : locationAddress || "Getting location..."
          }
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity className="bg-primary rounded-xl w-10 h-10 items-center justify-center shadow-lg">
        <Filter size={20} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};
