import { useRouter } from "expo-router";
import { MapPin, XIcon } from "phosphor-react-native";
import React from "react";
import {
  Animated,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ROUTES } from "../../config/constants";
import colors from "../../constants/custom-colors";
import { Club } from "../../types";
import { isClubOpenNow } from "../../utils/openingHours";

interface FacilityCardProps {
  facility: Club | null;
  isVisible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
}

export const FacilityCard = ({
  facility,
  isVisible,
  slideAnim,
  onClose,
}: FacilityCardProps) => {
  const router = useRouter();
  const windowHeight = Dimensions.get("window").height;

  if (!isVisible || !facility) return null;

  // Interpolated card height from animation value
  const cardHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, windowHeight * 0.25],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: cardHeight,
      }}
      className="bg-surface rounded-t-3xl border-t-2 border-primary shadow-2xl"
    >
      <TouchableOpacity
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/50 items-center justify-center"
        onPress={onClose}
      >
        <XIcon size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View className="flex-row space-x-4 p-5">
        <View>
          <Image
            source={{
              uri:
                facility.club_images?.find((img) => img.type === "avatar")
                  ?.url ||
                facility.avatar_url ||
                facility.image_url ||
                "https://via.placeholder.com/150",
            }}
            className="w-[110px] h-[140px] rounded-xl border-2 border-primary"
          />
        </View>
        <View className="flex-1 justify-between ml-5">
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-primary text-sm font-semibold">
                {facility.type || "Gym"}
              </Text>
            </View>
            <Text className="text-textPrimary text-xl font-bold mb-2">
              {facility.name}
            </Text>
            <View className="flex-row items-center space-x-1.5 mb-2">
              <MapPin size={14} color={colors.textSecondary} />
              <Text className="text-textSecondary text-sm">
                {facility.distance
                  ? `${facility.distance.toFixed(1)}km bort`
                  : "Avstånd okänt"}
              </Text>
            </View>
            <View className="flex-row items-center mb-4">
              <View
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  isClubOpenNow(facility) ? "bg-accentGreen" : "bg-accentRed"
                }`}
              />
              <Text className="text-textPrimary text-sm font-medium">
                {isClubOpenNow(facility) ? "Öppet nu" : "Stängt"}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-primary rounded-xl py-2.5 items-center shadow-lg"
            onPress={() => router.push(ROUTES.FACILITY(facility.id) as any)}
          >
            <Text className="text-textPrimary text-sm font-semibold">
              Visa Klubb
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
