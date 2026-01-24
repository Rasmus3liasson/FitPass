import { Text, View } from "react-native";

interface ActivityInsight {
  topGym?: string;
  topClass?: string;
  totalGyms?: number;
  totalClassTypes?: number;
}

interface JourneyStatsData {
  completedCount: number;
  totalCount: number;
  recentWeekCount: number;
  activityInsights?: ActivityInsight;
}

interface JourneyStatsCardProps {
  data: JourneyStatsData;
  variant?: "full" | "compact";
}

export function JourneyStatsCard({
  data,
  variant = "compact",
}: JourneyStatsCardProps) {
  const { completedCount, totalCount, recentWeekCount, activityInsights } =
    data;

  return (
    <View className="p-2">
      <Text className="text-textPrimary font-bold text-lg mb-6">
        Din aktivitet
      </Text>

      {/* Main Stats Row */}
      <View className="flex-row justify-between mb-6">
        <View className="items-center">
          <Text className="text-textPrimary font-bold text-3xl mb-1">
            {completedCount}
          </Text>
          <Text className="text-textSecondary text-xs">Slutförda</Text>
        </View>

        <View className="w-px bg-borderGray/20" />

        <View className="items-center">
          <Text className="text-accentGreen font-bold text-3xl mb-1">
            {recentWeekCount}
          </Text>
          <Text className="text-textSecondary text-xs">Denna vecka</Text>
        </View>

        <View className="w-px bg-borderGray/20" />

        <View className="items-center">
          <Text className="text-textPrimary font-bold text-3xl mb-1">
            {totalCount}
          </Text>
          <Text className="text-textSecondary text-xs">Totalt</Text>
        </View>
      </View>

      {/* Activity Insights */}
      {activityInsights &&
        (activityInsights.topGym || activityInsights.topClass) && (
          <View>
            <View className="h-px bg-borderGray/20 mb-4" />

            <View className="space-y-4 flex-row justify-between">
              {activityInsights.topGym && (
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-textSecondary text-xs mb-1">
                      Mest besökt gym
                    </Text>
                    <Text
                      className="text-textPrimary font-semibold text-base"
                      numberOfLines={1}
                    >
                      {activityInsights.topGym}
                    </Text>
                  </View>
                  {activityInsights.totalGyms &&
                    activityInsights.totalGyms > 1 && (
                      <View className="bg-primary/10 px-2 py-1 rounded-full ml-2">
                        <Text className="text-primary text-xs font-semibold">
                          +{activityInsights.totalGyms - 1}
                        </Text>
                      </View>
                    )}
                </View>
              )}

              {activityInsights.topClass && (
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-textSecondary text-xs mb-1">
                      Favorit träning
                    </Text>
                    <Text
                      className="text-textPrimary font-semibold text-base"
                      numberOfLines={1}
                    >
                      {activityInsights.topClass}
                    </Text>
                  </View>
                  {activityInsights.totalClassTypes &&
                    activityInsights.totalClassTypes > 1 && (
                      <View className="bg-accentYellow/10 px-2 py-1 rounded-full ml-2">
                        <Text className="text-accentYellow text-xs font-semibold">
                          +{activityInsights.totalClassTypes - 1}
                        </Text>
                      </View>
                    )}
                </View>
              )}
            </View>
          </View>
        )}
    </View>
  );
}
