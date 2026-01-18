import { MapPin, StarIcon, User } from "phosphor-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";
import { ProfileAchievements } from "./ProfileAchievements";
import { ProfileGoals } from "./ProfileGoals";
import { ProfileStats } from "./ProfileStats";

interface ProfileOverviewTabProps {
  user: {
    bio?: string;
    favorite_activities?: string[];
    mutual_friends_count?: number;
    city?: string;
    current_streak?: number;
    workouts_this_week?: number;
    status?: "pending" | "accepted" | "blocked";
  };
  currentStreak: number;
  workoutsThisWeek: number;
  totalWorkouts: number;
  onViewMutualFriends: () => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  user,
  currentStreak,
  workoutsThisWeek,
  totalWorkouts,
  onViewMutualFriends,
}) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Stats Grid */}
      <ProfileStats
        currentStreak={currentStreak}
        workoutsThisWeek={workoutsThisWeek}
        totalWorkouts={totalWorkouts}
      />

      {/* About/Bio Section */}
      {user.bio && (
        <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
          <View className="flex-row items-center mb-2">
            <User size={18} color={colors.textSecondary} />
            <Text className="text-textPrimary font-semibold text-base ml-2">
              Om
            </Text>
          </View>
          <Text className="text-textSecondary leading-5">{user.bio}</Text>
          {user.city && (
            <View className="flex-row items-center mt-3">
              <MapPin size={14} color={colors.textSecondary} />
              <Text className="text-textSecondary text-sm ml-1">
                {user.city}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Favorite Activities */}
      {user.favorite_activities && user.favorite_activities.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 mb-6 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-textPrimary font-semibold text-base">
              Favoritaktiviteter
            </Text>
            <StarIcon size={18} color={colors.primary}  />
          </View>
          <View className="flex-row flex-wrap gap-2">
            {user.favorite_activities.map((activity, index) => (
              <View
                key={index}
                className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
              >
                <Text className="text-textPrimary text-sm font-medium">
                  {activity}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Achievements Section */}
      <ProfileAchievements
        currentStreak={currentStreak}
        totalWorkouts={totalWorkouts}
        workoutsThisWeek={workoutsThisWeek}
      />

      {/* Training Goals Section */}
      <ProfileGoals
        currentStreak={currentStreak}
        workoutsThisWeek={workoutsThisWeek}
      />

      {/* Quick Actions */}
      {/* <ProfileQuickActions userStatus={user.status} /> */}

      {/* Mutual Friends */}
      {user.mutual_friends_count !== undefined &&
        user.mutual_friends_count > 0 && (
          <TouchableOpacity
            onPress={onViewMutualFriends}
            activeOpacity={0.7}
            className="bg-surface rounded-2xl p-5 mb-4 border border-border"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="flex-row -space-x-2 mr-3">
                  <View className="w-10 h-10 rounded-full bg-primary/20 border-2 border-surface items-center justify-center">
                    <User size={16} color={colors.primary} />
                  </View>
                  <View className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-surface items-center justify-center">
                    <User size={16} color={colors.accentBlue} />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold">
                    {user.mutual_friends_count} gemensamma vänner
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    Se vilka ni båda känner
                  </Text>
                </View>
              </View>
              <Text className="text-textPrimary text-sm">→</Text>
            </View>
          </TouchableOpacity>
        )}
    </ScrollView>
  );
};
