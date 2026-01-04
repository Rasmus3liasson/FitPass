import { Target } from "phosphor-react-native";
import React from "react";
import { Text, View } from "react-native";
import colors from "../../constants/custom-colors";

interface ProfileGoalsProps {
  currentStreak: number;
  workoutsThisWeek: number;
}

export const ProfileGoals: React.FC<ProfileGoalsProps> = ({
  currentStreak,
  workoutsThisWeek,
}) => {
  if (currentStreak === 0) {
    return null;
  }

  return (
    <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Target size={20} color={colors.primary} />
          <Text className="text-textPrimary font-semibold text-base ml-2">
            Framsteg
          </Text>
        </View>
      </View>
      <View className="space-y-4">
        {/* Streak Progress */}
        <View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-textSecondary text-sm">
              Nästa streak-mål
            </Text>
            <Text className="text-textPrimary text-sm font-semibold">
              {currentStreak}/{currentStreak >= 30 ? "∞" : currentStreak >= 7 ? "30" : "7"} dagar
            </Text>
          </View>
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
              style={{
                width: `${Math.min(
                  (currentStreak /
                    (currentStreak >= 30 ? 30 : currentStreak >= 7 ? 30 : 7)) *
                    100,
                  100
                )}%`,
              }}
            />
          </View>
        </View>

        {/* Weekly Progress */}
        <View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-textSecondary text-sm">
              Veckans träningar
            </Text>
            <Text className="text-textPrimary text-sm font-semibold">
              {workoutsThisWeek}/7 dagar
            </Text>
          </View>
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              style={{
                width: `${Math.min((workoutsThisWeek / 7) * 100, 100)}%`,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
