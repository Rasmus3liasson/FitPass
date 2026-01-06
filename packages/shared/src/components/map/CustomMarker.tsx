import React from "react";
import { Image, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import colors from "../../constants/custom-colors";
import { Club } from "../../types";
import { isClubOpenNow } from "../../utils/openingHours";

interface CustomMarkerProps {
  club: Club;
  onPress: () => void;
  distance: number | null;
}

export const CustomMarker = ({
  club,
  onPress,
  distance,
}: CustomMarkerProps) => {
  const isOpen = isClubOpenNow(club);

  const imageUrl =
    club.club_images?.find((img) => img.type === "avatar")?.url ||
    club.avatar_url ||
    club.image_url;

  return (
    <Marker
      key={club.id}
      coordinate={{
        latitude: club.latitude!,
        longitude: club.longitude!,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View className="items-center">
        {/* Modern pin shape with image matching facility card style */}
        <View className="relative">
          {/* Main pin body with rounded image */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 2,
             /*  borderColor: isOpen
                ? colors.accentGreen
                : colors.borderGray + "40", */
              backgroundColor: colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.4,
              shadowRadius: 5,
              elevation: 6,
            }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: 56,
                height: 56,
              }}
              resizeMode="cover"
            />

            {/* Status badge matching facility card */}
            <View
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <Text className="text-white text-[7px] font-bold">
                {isOpen ? "ÖPPET" : "STÄNGT"}
              </Text>
            </View>
          </View>

          {/* Pin point/tail */}
          <View
            className="w-0 h-0 self-center"
            style={{
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 12,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
             /*  borderTopColor: isOpen
                ? colors.accentGreen
                : colors.borderGray + "80", */
            }}
          />
        </View>
      </View>
    </Marker>
  );
};
