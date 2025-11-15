import { useCreditSummary } from "@/src/hooks/useCreditUsage";
import { Text, View } from "react-native";

interface DailyAccessSummaryCardProps {
  currentGymCount: number;
  pendingCount: number;
  creditPerGym: number;
  userId?: string;
}

export function DailyAccessSummaryCard({
  currentGymCount,
  pendingCount,
  creditPerGym,
  userId,
}: DailyAccessSummaryCardProps) {
  const { data: creditSummary } = useCreditSummary(userId);
  return (
    <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
      <Text className="font-semibold text-textPrimary mb-3">Sammanfattning</Text>
      <View className="space-y-2">
        {currentGymCount > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-textSecondary">Aktiva gym</Text>
            <Text className="text-sm font-medium text-textPrimary">
              {currentGymCount} × {creditPerGym} krediter
            </Text>
          </View>
        )}
        {pendingCount > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-textSecondary">Väntande ändringar</Text>
            <Text className="text-sm font-medium text-accentOrange">
              {pendingCount} gym
            </Text>
          </View>
        )}
        <View className="pt-2 border-t border-white/10 mt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-textPrimary">Total krediter per månad</Text>
            <Text className="text-sm font-bold text-primary">30 krediter</Text>
          </View>
          {creditSummary && (
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-xs text-textSecondary">Använda denna månad</Text>
              <Text className="text-xs font-medium text-accentOrange">
                {creditSummary.totalCreditsUsed}/{creditSummary.totalCreditsAllocated}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}