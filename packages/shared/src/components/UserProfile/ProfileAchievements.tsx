import colors from '@shared/constants/custom-colors';
import { Award, Flame, Trophy, Zap } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface ProfileAchievementsProps {
  currentStreak: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
}

export const ProfileAchievements: React.FC<ProfileAchievementsProps> = ({
  currentStreak,
  totalWorkouts,
  workoutsThisWeek,
}) => {
  if (currentStreak < 7 && totalWorkouts < 50 && workoutsThisWeek < 5) {
    return null;
  }

  return (
    <View className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-5 mb-6 border border-yellow-500/20">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-yellow-500/20 items-center justify-center mr-3">
          <Award size={20} color="#eab308" strokeWidth={2} />
        </View>
        <Text className="text-textPrimary font-bold text-base">
          Utmärkelser
        </Text>
      </View>
      <View className="space-y-3">
        {currentStreak >= 7 && (
          <View className="flex-row items-center bg-background/50 rounded-xl p-3">
            <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center mr-3">
              <Flame size={18} color={colors.accentRed} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold">
                {currentStreak >= 30 ? "🔥 Streak Master" : "🔥 Streak Warrior"}
              </Text>
              <Text className="text-textSecondary text-xs">
                {currentStreak} dagars träningsstreak
              </Text>
            </View>
          </View>
        )}
        {totalWorkouts >= 50 && (
          <View className="flex-row items-center bg-background/50 rounded-xl p-3">
            <View className="w-10 h-10 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
              <Trophy size={18} color={colors.primary} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold">
                {totalWorkouts >= 100 ? "💪 Century Club" : "💪 Half Century"}
              </Text>
              <Text className="text-textSecondary text-xs">
                {totalWorkouts}+ totala träningar
              </Text>
            </View>
          </View>
        )}
        {workoutsThisWeek >= 5 && (
          <View className="flex-row items-center bg-background/50 rounded-xl p-3">
            <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
              <Zap size={18} color={colors.accentPurple} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold">
                ⚡ Weekly Warrior
              </Text>
              <Text className="text-textSecondary text-xs">
                {workoutsThisWeek} träningar denna vecka
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
