import { Zap } from "lucide-react-native";
import React, { ReactNode } from "react";
import { Text, View } from "react-native";
import colors from "../constants/custom-colors";
import { FloatingButton } from "./FloatingButton";

interface FloatingActionButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  credits?: number;
  facilityName?: string;
  isVisible?: boolean;
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  variant?: "simple" | "checkin";
  customContent?: ReactNode;
}

export function FloatingActionButton({
  onPress,
  text,
  disabled = false,
  credits,
  facilityName,
  isVisible = true,
  position = "bottom-center",
  variant = "simple",
  customContent,
}: FloatingActionButtonProps) {
  const renderContent = () => {
    if (customContent) return customContent;

    if (variant === "checkin" && credits !== undefined && facilityName) {
      return (
        <View className="flex-row items-center justify-between bg-primary py-3 px-4 rounded-2xl min-w-[250px] max-w-[340px] flex-shrink">
          <View className="flex-1 mr-3">
            <Text className="text-white font-semibold text-sm mb-0.5">
              Check In
            </Text>
            <Text
              className="text-white/70 text-xs"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {facilityName}
            </Text>
          </View>

          <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
            <Zap size={12} color="#FFFFFF" />
            <Text className="text-white font-semibold text-xs ml-1">
              {credits}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        className={`py-4 px-6 items-center rounded-2xl min-w-[180px] ${
          disabled ? "bg-gray-700" : "bg-primary"
        }`}
      >
        <Text
          className={`font-bold text-lg ${
            disabled ? "text-gray-400" : "text-white"
          }`}
        >
          {text || "Action"}
        </Text>
      </View>
    );
  };

  return (
    <FloatingButton
      onPress={onPress}
      isVisible={isVisible}
      position={position}
      disabled={disabled}
      shadowColor={variant === "checkin" ? "#6366F1" : colors.primary}
      animationEnabled={variant === "checkin"}
    >
      {renderContent()}
    </FloatingButton>
  );
}
