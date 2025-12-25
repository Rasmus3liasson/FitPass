import { useUserBookings } from "../../hooks/useBookings";
import { type SelectedGym } from "../../hooks/useDailyAccess";
import { ScrollView, Text, View } from "react-native";
import { CreditDistributionCard } from "./CreditDistributionCard";
import { CurrentGymsDisplay } from "./CurrentGymsDisplay";
import { DailyAccessActionButton } from "./DailyAccessActionButton";
import { DailyAccessSummaryCard } from "./DailyAccessSummaryCard";

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface DailyAccessOverviewProps {
  enrichedCurrentGyms: EnrichedGym[];
  enrichedPendingGyms: EnrichedGym[];
  currentPeriodEnd?: string;
  userId?: string;
  membership?: any;
  onSelectGyms: () => void;
  onPendingGymOptions?: (gymId: string) => void;
  onGymPress?: (gymId: string) => void;
  onGymRemoved?: () => void;
  onCloseModal?: () => void;
}

export function DailyAccessOverview({
  enrichedCurrentGyms,
  enrichedPendingGyms,
  currentPeriodEnd,
  userId,
  membership,
  onSelectGyms,
  onPendingGymOptions,
  onGymPress,
  onGymRemoved,
  onCloseModal,
}: DailyAccessOverviewProps) {
  // Get user bookings for real credit usage data
  const bookingsQuery = useUserBookings(userId || "");
  const bookings = bookingsQuery.data || [];

  // Calculate dynamic credit distribution
  const calculateCreditDistribution = (gymCount: number) => {
    if (gymCount === 1) return 30;
    if (gymCount === 2) return 15;
    if (gymCount === 3) return 10;
    return 30; // fallback
  };

  const currentGymCount = enrichedCurrentGyms.length;
  const totalSelectedCount = currentGymCount + enrichedPendingGyms.length;
  const creditPerGym = calculateCreditDistribution(currentGymCount || 1);

  const isNewUser = totalSelectedCount === 0;

  return (
    <>
      {/* Header */}
      <View className="px-6 pt-6 pb-4 border-b border-white/5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="text-textPrimary text-2xl font-bold">
                Daily Access
              </Text>
            </View>
            <Text className="text-textSecondary text-base">
              Hantera dina valda klubbar för obegränsad access
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-4">
          {/* Credit Distribution Card */}
          <CreditDistributionCard
            currentGymCount={currentGymCount}
            creditPerGym={creditPerGym}
          />

          {/* Current/Pending Gyms Display */}
          <CurrentGymsDisplay
            enrichedCurrentGyms={enrichedCurrentGyms}
            enrichedPendingGyms={enrichedPendingGyms}
            creditPerGym={creditPerGym}
            userId={userId}
            membership={membership}
            bookings={bookings}
            onPendingGymOptions={onPendingGymOptions}
            onGymPress={onGymPress}
            onGymRemoved={onGymRemoved}
            onCloseModal={onCloseModal}
          />

          {/* Summary Card */}
          {totalSelectedCount > 0 && (
            <DailyAccessSummaryCard
              currentGymCount={currentGymCount}
              pendingCount={enrichedPendingGyms.length}
              creditPerGym={creditPerGym}
              userId={userId}
              membership={membership}
              bookings={bookings}
            />
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="px-6 py-4 border-t border-white/5 bg-background">
        <DailyAccessActionButton
          hasCurrentGyms={currentGymCount > 0}
          hasPendingGyms={enrichedPendingGyms.length > 0}
          onSelectGyms={onSelectGyms}
          isFirstTime={isNewUser}
        />
      </View>
    </>
  );
}
