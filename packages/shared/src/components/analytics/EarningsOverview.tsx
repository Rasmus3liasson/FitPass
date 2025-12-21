import {
    getClubEarnings
} from "../services/stripeEarningsService";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

interface EarningsOverviewProps {
  clubId: string;
  selectedPeriod: "week" | "month" | "quarter" | "year";
}

export const EarningsOverview: React.FC<EarningsOverviewProps> = ({
  clubId,
  selectedPeriod,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["club-earnings", clubId, selectedPeriod],
    queryFn: () => getClubEarnings(clubId, selectedPeriod),
    enabled: !!clubId,
  });

  if (isLoading) {
    return (
      <View className="px-6 mb-6">
        <View className="bg-surface rounded-2xl p-6 items-center justify-center">
          <ActivityIndicator size="small" color="#6366F1" />
          <Text className="text-textSecondary text-sm mt-2">
            Laddar intäktsdata...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-6 mb-6">
        <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <Text className="text-red-400 text-sm font-semibold mb-1">
            Kunde inte ladda intäktsdata
          </Text>
          <Text className="text-red-400/70 text-xs">
            {error instanceof Error ? error.message : "Ett fel uppstod"}
          </Text>
        </View>
      </View>
    );
  }

  if (!data?.hasStripeAccount) {
    return (
      <View className="px-6 mb-6">
        <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <Text className="text-yellow-400 text-sm font-semibold mb-1">
            Stripe ej anslutet
          </Text>
          <Text className="text-yellow-400/70 text-xs">
            Anslut ditt Stripe-konto under Inställningar för att se
            intäktsdata
          </Text>
        </View>
      </View>
    );
  }

  const earnings = data.earnings!;
  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2).replace(".", ",");
  };

  const periodText =
    selectedPeriod === "week"
      ? "denna vecka"
      : selectedPeriod === "month"
      ? "denna månad"
      : selectedPeriod === "quarter"
      ? "detta kvartal"
      : "detta år";

  return (
    <View className="px-6 mb-6">
      <Text className="text-textPrimary text-lg font-semibold mb-4">
        Intäktsöversikt
      </Text>

      {/* Total Earnings Card */}
      <View className="bg-surface rounded-2xl p-5 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-textSecondary text-sm mb-1">
              Totala intäkter {periodText}
            </Text>
            <Text className="text-textPrimary text-3xl font-bold">
              {formatAmount(earnings.totalAmount)} SEK
            </Text>
          </View>
        </View>

        {/* Balance Info */}
        <View className="flex-row space-x-3">
          <View className="flex-1 bg-background rounded-xl p-3">
            <Text className="text-textSecondary text-xs mb-1">
              Utbetalningar
            </Text>
            <Text className="text-textPrimary text-base font-semibold">
              {formatAmount(earnings.totalPayouts)} SEK
            </Text>
          </View>
          <View className="flex-1 bg-background rounded-xl p-3">
            <Text className="text-textSecondary text-xs mb-1">
              Tillgängligt
            </Text>
            <Text className="text-green-400 text-base font-semibold">
              {formatAmount(earnings.availableBalance)} SEK
            </Text>
          </View>
        </View>
      </View>

      {/* Statistics */}
      <View className="bg-surface rounded-2xl p-5 mb-4">
        <Text className="text-textPrimary text-base font-semibold mb-3">
          Statistik
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-textSecondary text-sm">Totala besök</Text>
            <Text className="text-textPrimary text-base font-semibold">
              {earnings.totalVisits}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-textSecondary text-sm">Unika användare</Text>
            <Text className="text-textPrimary text-base font-semibold">
              {earnings.uniqueUsers}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-textSecondary text-sm">
              Antal överföringar
            </Text>
            <Text className="text-textPrimary text-base font-semibold">
              {earnings.transferCount}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-textSecondary text-sm">
              Antal utbetalningar
            </Text>
            <Text className="text-textPrimary text-base font-semibold">
              {earnings.payoutCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription Breakdown */}
      {earnings.breakdown.length > 0 && (
        <View className="bg-surface rounded-2xl p-5 mb-4">
          <Text className="text-textPrimary text-base font-semibold mb-3">
            Fördelning per prenumerationstyp
          </Text>
          <View className="space-y-3">
            {earnings.breakdown.map((item, index) => (
              <View
                key={index}
                className="bg-background rounded-xl p-4 border border-accentGray/20"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-textPrimary text-sm font-semibold">
                    {item.planName}
                  </Text>
                  <Text className="text-primary text-sm font-bold">
                    {formatAmount(item.estimatedRevenue)} SEK
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-textSecondary text-xs">
                    {item.visitCount} besök
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {item.uniqueUsers} användare
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Info Message */}
      {earnings.totalVisits === 0 && (
        <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <Text className="text-blue-400 text-xs">
            Inga besök registrerade {periodText}. Intäktsdata uppdateras när
            användare besöker din klubb.
          </Text>
        </View>
      )}
    </View>
  );
};
