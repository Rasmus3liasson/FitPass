import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import colors from "../../constants/custom-colors";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  message?: string;
  color?: string;
}

/**
 * Reusable loading spinner with optional message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  message,
  color = colors.primary,
}) => {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-textPrimary text-lg font-semibold mt-4">
          {message}
        </Text>
      )}
    </View>
  );
};
