import {
    PasswordStrength,
    getPasswordRequirements,
} from "@/src/utils/passwordValidation";
import { Check, X } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator = ({
  strength,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) => {
  const requirements = getPasswordRequirements();

  return (
    <View className="mt-2">
      {/* Strength indicator */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-textPrimary text-sm font-medium">
          Password Strength:
        </Text>
        <Text
          className="text-sm font-semibold"
          style={{ color: strength.color }}
        >
          {strength.label}
        </Text>
      </View>

      {/* Strength bar */}
      <View className="flex-row space-x-1 mb-3">
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor:
                level <= strength.score ? strength.color : "#374151", // gray-700
            }}
          />
        ))}
      </View>

      {/* Requirements list */}
      {showRequirements && (
        <View className="space-y-1">
          <Text className="text-gray-400 text-xs font-medium mb-1">
            Requirements:
          </Text>
          {requirements.map((requirement, index) => {
            const checkKeys = [
              "minLength",
              "hasUppercase",
              "hasLowercase",
              "hasNumber",
            ] as const;
            const isChecked = strength.checks[checkKeys[index]];

            return (
              <View
                key={requirement}
                className="flex-row items-center space-x-2"
              >
                {isChecked ? (
                  <Check size={12} color="#22c55e" />
                ) : (
                  <X size={12} color="#ef4444" />
                )}
                <Text
                  className={`text-xs ${
                    isChecked ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {requirement}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
