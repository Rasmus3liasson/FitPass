import { Activity } from "phosphor-react-native";
import React from "react";
import { Text, View } from "react-native";
import colors from "../constants/custom-colors";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <View className="items-center">
      {showLogo && (
        <View className="w-16 h-16 rounded-2xl bg-indigo-500 items-center justify-center mb-4 shadow-lg">
          <Activity size={32} color={colors.textPrimary} strokeWidth={2} />
        </View>
      )}
      <Text className="text-3xl font-bold text-textPrimary mb-2 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-base text-textSecondary text-center leading-5 px-4">
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default AuthHeader;
