import colors from "@shared/constants/custom-colors";
import { CoinIcon } from "phosphor-react-native";
import { Text, View } from "react-native";

interface DailyAccessSummaryCardProps {
  currentGymCount: number;
  pendingCount: number;
  creditPerGym: number;
  enrichedCurrentGyms?: Array<{
    gym_id: string;
    clubData?: {
      credits?: number;
      name?: string;
    };
  }>;
  userId?: string;
  membership?: any;
  bookings?: any[];
}
interface IconBadgeProps {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
}


export function DailyAccessSummaryCard({
  currentGymCount,
  pendingCount,
  creditPerGym,
  enrichedCurrentGyms = [],
  userId,
  membership,
  bookings = [],
}: DailyAccessSummaryCardProps) {
  // Calculate actual credits used from bookings if available, otherwise use membership data
  const actualCreditsUsed =
    bookings.length > 0
      ? bookings.reduce(
          (total, booking) => total + (booking.credits_used || 0),
          0
        )
      : membership?.credits_used || 0;
  const membershipTotalCredits = membership?.credits || 30;
  const creditsRemaining = membershipTotalCredits - actualCreditsUsed;
  const usagePercentage = (actualCreditsUsed / membershipTotalCredits) * 100;

  // Get actual credit costs from club data
  const gymCosts = enrichedCurrentGyms
    .map(gym => gym.clubData?.credits || creditPerGym)
    .filter(cost => cost > 0);
  
  const minCost = gymCosts.length > 0 ? Math.min(...gymCosts) : creditPerGym;
  const maxCost = gymCosts.length > 0 ? Math.max(...gymCosts) : creditPerGym;
  const hasVariableCosts = minCost !== maxCost;

  // IconBadge component for consistent styling
  const IconBadge: React.FC<IconBadgeProps> = ({ label, value, icon }) => (
    <View className="bg-primary/20 px-4 py-2.5 rounded-xl flex-col items-center min-w-[90px]">
      <Text className="text-xs text-textSecondary font-medium mb-1">
        {label}
      </Text>
      {value ? (
        <Text className="text-base font-bold text-primary">{value}</Text>
      ) : (
        icon
      )}
    </View>
  );

  return (
    <View className="space-y-3 mb-6">
      {/* Summary Header */}
      <Text className="font-bold text-xl text-textPrimary mb-2">
        Sammanfattning
      </Text>

      {/* Active Gyms Card */}
      {currentGymCount > 0 && (
        <View className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm text-textSecondary font-medium mb-1">
                Aktiva gym
              </Text>
              <Text className="text-lg font-bold text-textPrimary">
                {currentGymCount} gym
              </Text>
            </View>
            <IconBadge 
              label="Fördelning" 
              value={`${creditPerGym} kr`} 
            />
          </View>
        </View>
      )}

      {/* Credit Usage Card */}
      <View className="bg-surface/10 rounded-2xl p-5 border border-white/5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-sm text-textSecondary font-medium mb-1">
              Krediter kvar
            </Text>
            <Text className="text-2xl font-black text-textPrimary">
              {creditsRemaining}{" "}
              <Text className="text-base font-semibold text-textSecondary">
                / {membershipTotalCredits}
              </Text>
            </Text>
          </View>
          <IconBadge
            label="Per besök"
            icon={
              <View className="flex-row items-center gap-1">
                {hasVariableCosts ? (
                  <Text className="text-base font-bold text-primary">
                    {minCost}-{maxCost}
                  </Text>
                ) : (
                  <Text className="text-base font-bold text-primary">
                    {minCost || creditPerGym}
                  </Text>
                )}
                <CoinIcon size={18} color={colors.primary} />
              </View>
            }
          />
        </View>

        {/* Progress Bar */}
        <View className="space-y-2">
          <View className="h-3 bg-surface/30 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(usagePercentage, 100)}%`,
              }}
            />
          </View>
          <Text className="text-xs text-textSecondary text-center">
            {actualCreditsUsed} krediter använda denna månad
          </Text>
        </View>
      </View>

      {/* Pending Changes Indicator */}
      {/* {pendingCount > 0 && (
        <View className="bg-primary/5 rounded-2xl px-5 py-4 border border-primary/20">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-textPrimary">
              Väntande ändringar
            </Text>
            <View className="bg-primary px-3 py-1.5 rounded-xl">
              <Text className="text-xs font-bold text-white">
                {pendingCount} gym
              </Text>
            </View>
          </View>
          <Text className="text-xs text-textSecondary mt-2">
            Ändringar aktiveras nästa period
          </Text>
        </View>
      )} */}
    </View>
  );
}
