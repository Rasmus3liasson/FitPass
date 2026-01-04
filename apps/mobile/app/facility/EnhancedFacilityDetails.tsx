import colors from "@shared/constants/custom-colors";
import { LinearGradient } from "expo-linear-gradient";
import {
  CaretDown,
  CaretUp,
  Coin,
  InfoIcon,
  MapPinIcon,
  StarIcon
} from "phosphor-react-native";
import { useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

interface Props {
  facility: {
    type: string;
    name: string;
    rating: number;
    reviewCount: number;
    address: string;
    openingHours: string;
    credits: number;
    description: string;
  };
  club?: any; // For accessing full club data with open_hours
  onViewOnMap?: () => void;
}

// Helper function to get current status
const getCurrentStatus = (openHours: Record<string, string>) => {
  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

  const todayHours = openHours[currentDay];

  if (!todayHours || todayHours.toLowerCase() === "closed") {
    return {
      isOpen: false,
      status: "Stängt",
      nextOpen: getNextOpenTime(openHours, now),
      isClosingSoon: false,
    };
  }

  // Parse hours (assume format like "06:00-22:00")
  const [openTime, closeTime] = todayHours.split("-");
  if (!openTime || !closeTime) {
    return {
      isOpen: false,
      status: "Stängt",
      nextOpen: null,
      isClosingSoon: false,
    };
  }

  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (currentTime >= openMinutes && currentTime < closeMinutes) {
    const minutesUntilClose = closeMinutes - currentTime;

    if (minutesUntilClose <= 60) {
      return {
        isOpen: true,
        status: `Stänger om ${minutesUntilClose}min`,
        isClosingSoon: true,
        nextOpen: null,
      };
    }
    return {
      isOpen: true,
      status: `Öppet till ${closeTime}`,
      isClosingSoon: false,
      nextOpen: null,
    };
  }

  return {
    isOpen: false,
    status: "Stängt",
    nextOpen: getNextOpenTime(openHours, now),
    isClosingSoon: false,
  };
};

const getNextOpenTime = (
  openHours: Record<string, string>,
  currentDate: Date
) => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = currentDate.getDay();

  for (let i = 1; i <= 7; i++) {
    const checkDay = (today + i) % 7;
    const dayName = days[checkDay];
    const hours = openHours[dayName];

    if (hours && hours.toLowerCase() !== "closed") {
      const dayNames = [
        "Söndag",
        "Måndag",
        "Tisdag",
        "Onsdag",
        "Torsdag",
        "Fredag",
        "Lördag",
      ];
      const openTime = hours.split("-")[0];
      return i === 1
        ? `Imorgon ${openTime}`
        : `${dayNames[checkDay]} ${openTime}`;
    }
  }
  return null;
};

export function EnhancedFacilityDetails({
  facility,
  club,
  onViewOnMap,
}: Props) {
  const [showAllHours, setShowAllHours] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));

  const { name, type, rating, reviewCount, address, credits, description } =
    facility;

  // Get status info
  const statusInfo = club?.open_hours
    ? getCurrentStatus(club.open_hours)
    : {
        isOpen: false,
        status: "Öppettider varierar",
        nextOpen: null,
        isClosingSoon: false,
      };

  const toggleHours = () => {
    setShowAllHours(!showAllHours);
    Animated.spring(expandAnimation, {
      toValue: showAllHours ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const formatOpeningHours = () => {
    if (!club?.open_hours) return [];

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayLabels = [
      "Måndag",
      "Tisdag",
      "Onsdag",
      "Torsdag",
      "Fredag",
      "Lördag",
      "Söndag",
    ];

    return days.map((day, index) => ({
      day: dayLabels[index],
      hours: club.open_hours[day] || "Stängt",
      isToday: new Date().getDay() === (index + 1) % 7,
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return colors.accentGreen;
    if (rating >= 4.0) return colors.intensityLow;
    if (rating >= 3.5) return colors.intensityMedium;
    if (rating >= 3.0) return colors.accentOrange;
    return colors.accentRed;
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Utmärkt";
    if (rating >= 4.0) return "Mycket bra";
    if (rating >= 3.5) return "Bra";
    if (rating >= 3.0) return "Okej";
    return "Under genomsnitt";
  };

  return (
    <View>
      {/* Header Section with Gradient */}
      <View className="mb-6">
        <LinearGradient
          colors={[
            "rgba(99, 102, 241, 0.1)",
            "rgba(139, 92, 246, 0.1)",
            "transparent",
          ]}
          className="absolute inset-0 rounded-2xl"
        />

        {/* Type Badge */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="bg-primary/20 rounded-full px-4 py-2">
            <Text className="text-primary font-semibold text-sm capitalize">
              {type}
            </Text>
          </View>

          {/* Status Indicator */}
          <View
            className={`rounded-full px-3 py-2 flex-row items-center ${
              statusInfo.isOpen
                ? statusInfo.isClosingSoon
                  ? "bg-accentOrange/20"
                  : "bg-accentGreen/20"
                : "bg-accentRed/20"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                statusInfo.isOpen
                  ? statusInfo.isClosingSoon
                    ? "bg-accentOrange"
                    : "bg-accentGreen"
                  : "bg-accentRed"
              }`}
            />
            <Text
              className={`text-sm font-medium ${
                statusInfo.isOpen
                  ? statusInfo.isClosingSoon
                    ? "text-accentOrange"
                    : "text-accentGreen"
                  : "text-accentRed"
              }`}
            >
              {statusInfo.status}
            </Text>
          </View>
        </View>

        {/* Facility Name */}
        <Text className="text-textPrimary font-bold text-2xl mb-4 leading-tight">
          {name}
        </Text>

        {/* Stats Row */}
        <View className="flex-row items-center justify-between mb-4">
          {/* Rating */}
          <View className="flex-row items-center bg-surface/50 rounded-xl px-4 py-3 flex-1 mr-2">
            <View className="ml-3 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-textPrimary font-bold text-lg">
                  {rating.toFixed(1)}
                </Text>
                <StarIcon size={20} color={getRatingColor(rating)} />
              </View>
              <Text className="text-textSecondary text-sm">
                {getRatingLabel(rating)} • {reviewCount} recensioner
              </Text>
            </View>
          </View>

          {/* Credits */}
          <View className="bg-surface/50 rounded-xl px-4 py-3 items-center">
            <View className="flex-row items-center mb-1">
              <Text className="text-textPrimary font-bold text-lg mr-1">
                {credits}
              </Text>
              <Coin size={16} color={colors.primary} />
            </View>
            <Text className="text-textSecondary text-xs">krediter</Text>
          </View>
        </View>
      </View>

      {/* Location */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-2 justify-between">
          <Text className="text-textPrimary font-semibold text-base ">
            Plats
          </Text>
          <MapPinIcon size={20} color={colors.primary} />
        </View>
        <Text className="text-textSecondary text-sm leading-relaxed">
          {address}
        </Text>
        <TouchableOpacity
          className="bg-primary/10 rounded-xl p-3 mt-3 flex-row items-center justify-center"
          onPress={onViewOnMap}
        >
          <MapPinIcon size={16} color={colors.primary} />
          <Text className="text-primary font-semibold ml-2">Visa på karta</Text>
        </TouchableOpacity>
      </View>

      {/* Opening Hours */}
      <View className="bg-surface rounded-2xl p-4 mb-6">
        <TouchableOpacity
          onPress={toggleHours}
          className="flex-row items-center justify-between mb-2"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-textPrimary font-semibold text-base">
              Öppettider
            </Text>
          </View>
          {showAllHours ? (
            <CaretUp size={20} color={colors.primary} weight="bold" />
          ) : (
            <CaretDown size={20} color={colors.primary} weight="bold" />
          )}
        </TouchableOpacity>

        <Text
          className={`text-sm font-medium mb-3 ${
            statusInfo.isOpen
              ? statusInfo.isClosingSoon
                ? "text-accentOrange"
                : "text-accentGreen"
              : "text-accentRed"
          }`}
        >
          {statusInfo.status}
          {!statusInfo.isOpen && statusInfo.nextOpen && (
            <Text className="text-textSecondary">
              {" "}
              • Öppnar {statusInfo.nextOpen}
            </Text>
          )}
        </Text>

        <Animated.View
          style={{
            maxHeight: expandAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 300],
            }),
            opacity: expandAnimation,
          }}
        >
          {showAllHours && (
            <View>
              {formatOpeningHours().map((day, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between items-center py-2 px-3 rounded-lg mb-1 ${
                    day.isToday ? "bg-primary/10" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      day.isToday ? "text-primary" : "text-textSecondary"
                    }`}
                  >
                    {day.day}
                  </Text>
                  <Text
                    className={`${
                      day.isToday
                        ? "text-textPrimary font-semibold"
                        : "text-textSecondary"
                    }`}
                  >
                    {day.hours}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>

      {/* About Section */}
      {description && (
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-3 justify-between">
            <Text className="text-textPrimary font-semibold text-base">
              Om denna plats
            </Text>
            <InfoIcon size={20} color={colors.primary} />
          </View>
          <Text className="text-textSecondary text-sm leading-relaxed">
            {description}
          </Text>
        </View>
      )}
    </View>
  );
}
