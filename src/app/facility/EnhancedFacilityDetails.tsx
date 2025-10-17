import { LinearGradient } from "expo-linear-gradient";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Star,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Animated,
  Text,
  TouchableOpacity,
  View
} from "react-native";

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
      status: "Closed",
      nextOpen: getNextOpenTime(openHours, now),
      isClosingSoon: false,
    };
  }

  // Parse hours (assume format like "06:00-22:00")
  const [openTime, closeTime] = todayHours.split("-");
  if (!openTime || !closeTime) {
    return {
      isOpen: false,
      status: "Closed",
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
        status: `Closes in ${minutesUntilClose}min`,
        isClosingSoon: true,
        nextOpen: null,
      };
    }
    return {
      isOpen: true,
      status: `Open until ${closeTime}`,
      isClosingSoon: false,
      nextOpen: null,
    };
  }

  return {
    isOpen: false,
    status: "Closed",
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
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const openTime = hours.split("-")[0];
      return i === 1
        ? `Tomorrow at ${openTime}`
        : `${dayNames[checkDay]} at ${openTime}`;
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
        status: "Hours vary",
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
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return days.map((day, index) => ({
      day: dayLabels[index],
      hours: club.open_hours[day] || "Closed",
      isToday: new Date().getDay() === (index + 1) % 7,
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "#4CAF50";
    if (rating >= 4.0) return "#8BC34A";
    if (rating >= 3.5) return "#FFC107";
    if (rating >= 3.0) return "#FF9800";
    return "#F44336";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.5) return "Good";
    if (rating >= 3.0) return "Average";
    return "Below Average";
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
              {type} • Premium Partner
            </Text>
          </View>

          {/* Status Indicator */}
          <View
            className={`rounded-full px-3 py-2 flex-row items-center ${
              statusInfo.isOpen
                ? statusInfo.isClosingSoon
                  ? "bg-orange-500/20"
                  : "bg-green-500/20"
                : "bg-red-500/20"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                statusInfo.isOpen
                  ? statusInfo.isClosingSoon
                    ? "bg-orange-500"
                    : "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <Text
              className={`text-sm font-medium ${
                statusInfo.isOpen
                  ? statusInfo.isClosingSoon
                    ? "text-orange-400"
                    : "text-green-400"
                  : "text-red-400"
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
            <Star
              size={20}
              color={getRatingColor(rating)}
              fill={getRatingColor(rating)}
            />
            <View className="ml-3 flex-1">
              <Text className="text-textPrimary font-bold text-lg">
                {rating.toFixed(1)}
              </Text>
              <Text className="text-textSecondary text-sm">
                {getRatingLabel(rating)} • {reviewCount} reviews
              </Text>
            </View>
          </View>

          {/* Credits */}
          <View className="bg-surface/50 rounded-xl px-4 py-3 items-center">
            <View className="flex-row items-center mb-1">
              <Zap size={16} color="#6366F1" />
              <Text className="text-textPrimary font-bold text-lg ml-1">
                {credits}
              </Text>
            </View>
            <Text className="text-textSecondary text-xs">credits</Text>
          </View>
        </View>
      </View>

      {/* Location */}
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-2">
          <MapPin size={20} color="#6366F1" />
          <Text className="text-textPrimary font-semibold text-base ml-3">
            Location
          </Text>
        </View>
        <Text className="text-textSecondary text-sm leading-relaxed ml-8">
          {address}
        </Text>
        <TouchableOpacity
          className="bg-primary/10 rounded-xl p-3 mt-3 flex-row items-center justify-center"
          onPress={onViewOnMap}
        >
          <MapPin size={16} color="#6366F1" />
          <Text className="text-primary font-semibold ml-2">View on Map</Text>
        </TouchableOpacity>
      </View>

      {/* Opening Hours */}
      <View className="bg-surface rounded-2xl p-4 mb-6">
        <TouchableOpacity
          onPress={toggleHours}
          className="flex-row items-center justify-between mb-2"
        >
          <View className="flex-row items-center">
            <Clock size={20} color="#6366F1" />
            <Text className="text-textPrimary font-semibold text-base ml-3">
              Opening Hours
            </Text>
          </View>
          {showAllHours ? (
            <ChevronUp size={20} color="#6366F1" />
          ) : (
            <ChevronDown size={20} color="#6366F1" />
          )}
        </TouchableOpacity>

        <Text
          className={`text-sm font-medium ml-8 mb-3 ${
            statusInfo.isOpen
              ? statusInfo.isClosingSoon
                ? "text-orange-400"
                : "text-green-400"
              : "text-red-400"
          }`}
        >
          {statusInfo.status}
          {!statusInfo.isOpen && statusInfo.nextOpen && (
            <Text className="text-textSecondary">
              {" "}
              • Opens {statusInfo.nextOpen}
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
            <View className="ml-8">
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
          <View className="flex-row items-center mb-3">
            <Award size={20} color="#6366F1" />
            <Text className="text-textPrimary font-semibold text-base ml-3">
              About This Place
            </Text>
          </View>
          <Text className="text-textSecondary text-sm leading-relaxed ml-8">
            {description}
          </Text>
        </View>
      )}
    </View>
  );
}
