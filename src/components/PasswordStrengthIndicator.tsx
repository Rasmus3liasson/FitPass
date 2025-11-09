import {
  PasswordStrength,
  getPasswordRequirements,
} from "@/src/utils/passwordValidation";
import { Check, X } from "lucide-react-native";
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
          Lösenordets styrka
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
                level <= strength.score ? strength.color : "#374151", // accentGray
            }}
          />
        ))}
      </View>

      {/* Requirements list */}
      {showRequirements && (
        <View className="space-y-1">
          <Text className="text-textSecondary text-xs font-medium mb-1">
            Krav:
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
                    isChecked ? "text-green-400" : "text-textSecondary"
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
