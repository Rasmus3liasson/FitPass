import { type SelectedGym } from "@/src/hooks/useDailyAccess";
import { ScrollView, Text, View } from "react-native";
import { CurrentGymsDisplay } from "./CurrentGymsDisplay";
import { DailyAccessActionButton } from "./DailyAccessActionButton";
import { DailyAccessStatusCard } from "./DailyAccessStatusCard";

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface DailyAccessOverviewProps {
  enrichedCurrentGyms: EnrichedGym[];
  enrichedPendingGyms: EnrichedGym[];
  currentPeriodEnd?: string;
  onSelectGyms: () => void;
  onViewStatus: () => void;
  onPendingGymOptions?: (gymId: string) => void;
  onGymPress?: (gymId: string) => void;
}

export function DailyAccessOverview({
  enrichedCurrentGyms,
  enrichedPendingGyms,
  currentPeriodEnd,
  onSelectGyms,
  onViewStatus,
  onPendingGymOptions,
  onGymPress,
}: DailyAccessOverviewProps) {
  const isNewUser =
    enrichedCurrentGyms.length === 0 && enrichedPendingGyms.length === 0;
  const hasPendingGyms = enrichedPendingGyms.length > 0;

  return (
    <>
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-textPrimary text-2xl font-bold mb-2">
              Daily Access
            </Text>
            <Text className="text-textSecondary text-base">
              Hantera dina valda klubbar för obegränsad access
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6">
        {/* Status Info */}
        <DailyAccessStatusCard
          isNewUser={isNewUser}
          hasPendingGyms={hasPendingGyms}
          currentPeriodEnd={currentPeriodEnd}
        />

        {/* Current/Pending Gyms */}
        <View className="mb-4">
          <CurrentGymsDisplay
            enrichedCurrentGyms={enrichedCurrentGyms}
            enrichedPendingGyms={enrichedPendingGyms}
            onPendingGymOptions={onPendingGymOptions}
            onGymPress={onGymPress}
          />
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="px-6 py-4 mb-24">
        <DailyAccessActionButton
          hasCurrentGyms={enrichedCurrentGyms.length > 0}
          hasPendingGyms={enrichedPendingGyms.length > 0}
          onPress={onSelectGyms}
        />
      </View>
    </>
  );
}
