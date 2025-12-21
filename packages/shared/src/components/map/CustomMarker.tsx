import { Club } from "../types";
import { isClubOpenNow } from "../utils/openingHours";
import React from "react";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";

interface CustomMarkerProps {
  club: Club;
  onPress: () => void;
  distance: number | null;
}

export const CustomMarker = ({ club, onPress, distance }: CustomMarkerProps) => {
  const isOpen = isClubOpenNow(club);
  
  return (
    <Marker
      key={club.id}
      coordinate={{
        latitude: club.latitude!,
        longitude: club.longitude!,
      }}
      onPress={onPress}
    >
      <View className={`bg-surface rounded-[20px] border-3 ${isOpen ? 'border-accentGreen' : 'border-accentRed'} p-2 items-center shadow-lg`}>
        <View className="w-3 h-3 rounded-full bg-primary" />
        <Text className="text-textPrimary text-[10px] font-bold mt-0.5 text-center">
          {club.type || 'GYM'}
        </Text>
        {distance && (
          <Text className="text-textSecondary text-[8px] mt-0.5">
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </Text>
        )}
      </View>
    </Marker>
  );
};
