import { useTheme } from "@/src/components/ThemeProvider";
import React from "react";
import { Text, View } from "react-native";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  const { isDark } = useTheme();

  return (
    <View className="mb-2">
      <Text
        className={`font-semibold mb-3 text-lg ${
          isDark ? "text-textPrimary" : "text-lightTextPrimary"
        }`}
      >
        {label}
      </Text>
      {children}
      {error && <Text className="text-red-400 text-sm mt-1">{error}</Text>}
    </View>
  );
};
