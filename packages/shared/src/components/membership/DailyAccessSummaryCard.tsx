import { Text, View } from "react-native";

interface DailyAccessSummaryCardProps {
  currentGymCount: number;
  pendingCount: number;
  creditPerGym: number;
  userId?: string;
  membership?: any;
  bookings?: any[];
}

export function DailyAccessSummaryCard({
  currentGymCount,
  pendingCount,
  creditPerGym,
  userId,
  membership,
  bookings = [],
}: DailyAccessSummaryCardProps) {
  // Calculate actual credits used from bookings if available, otherwise use membership data
  const actualCreditsUsed = bookings.length > 0 
    ? bookings.reduce((total, booking) => total + (booking.credits_used || 0), 0)
    : membership?.credits_used || 0;
  const membershipTotalCredits = membership?.credits || 30;
  return (
    <View className="bg-surface/50 rounded-3xl p-6 mb-6 border border-white/5">
      <Text className="font-bold text-xl text-textPrimary mb-4">Sammanfattning</Text>
      <View className="space-y-3">
        {currentGymCount > 0 && (
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-textSecondary">Aktiva gym</Text>
            <Text className="text-sm font-semibold text-textPrimary">
              {currentGymCount} × {creditPerGym} krediter
            </Text>
          </View>
        )}
        {pendingCount > 0 && (
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm text-textSecondary">Väntande ändringar</Text>
            <View className="bg-accentOrange/10 px-3 py-1 rounded-full">
              <Text className="text-sm font-semibold text-accentOrange">
                {pendingCount} gym
              </Text>
            </View>
          </View>
        )}
        <View className="pt-3 border-t border-white/10 mt-2">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-base font-semibold text-textPrimary">Total krediter per månad</Text>
            <Text className="text-base font-bold text-primary">{membershipTotalCredits} krediter</Text>
          </View>
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm text-textSecondary">Använda denna månad</Text>
            <Text className="text-sm font-semibold text-textPrimary">
              {actualCreditsUsed}/{membershipTotalCredits}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}