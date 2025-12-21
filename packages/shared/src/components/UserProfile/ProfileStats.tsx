import { Activity, Flame, TrendingUp } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface ProfileStatsProps {
  currentStreak: number;
  workoutsThisWeek: number;
  totalWorkouts: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  currentStreak,
  workoutsThisWeek,
  totalWorkouts,
}) => {
  return (
    <View className="flex-row gap-3 mb-6">
      {/* Current Streak */}
      <View className="flex-1 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-4 border border-red-500/20">
        <View className="flex-row items-center justify-between mb-2">
          <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center">
            <Flame size={20} color="#ef4444" strokeWidth={2} />
          </View>
          <Text className="text-2xl font-bold text-textPrimary">
            {currentStreak}
          </Text>
        </View>
        <Text className="text-textSecondary text-xs font-medium">
          Dagars streak
        </Text>
      </View>

      {/* This Week */}
      <View className="flex-1 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-4 border border-purple-500/20">
        <View className="flex-row items-center justify-between mb-2">
          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
            <TrendingUp size={20} color="#8b5cf6" strokeWidth={2} />
          </View>
          <Text className="text-2xl font-bold text-textPrimary">
            {workoutsThisWeek}
          </Text>
        </View>
        <Text className="text-textSecondary text-xs font-medium">
          Denna vecka
        </Text>
      </View>

      {/* Total Workouts */}
      <View className="flex-1 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20">
        <View className="flex-row items-center justify-between mb-2">
          <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
            <Activity size={20} color="#3b82f6" strokeWidth={2} />
          </View>
          <Text className="text-2xl font-bold text-textPrimary">
            {totalWorkouts}
          </Text>
        </View>
        <Text className="text-textSecondary text-xs font-medium">
          Totalt
        </Text>
      </View>
    </View>
  );
};
