import { Text, View } from "react-native";

interface CreditDistributionCardProps {
  currentGymCount: number;
  creditPerGym: number;
}

export function CreditDistributionCard({
  currentGymCount,
  creditPerGym,
}: CreditDistributionCardProps) {
  return (
    <View className="bg-surface/50 rounded-3xl p-6 mb-6 border border-white/5">
      <View className="flex-row items-center mb-4">
        <Text className="text-xl font-bold text-textPrimary">
          Kreditfördelning
        </Text>
      </View>
      <Text className="text-textSecondary text-sm mb-4 leading-5">
        Dina 30 krediter fördelas baserat på valda gym:
      </Text>
      <View className="space-y-3">
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-textSecondary">1 gym valt</Text>
          <Text className="text-sm font-semibold text-textPrimary">
            30 krediter
          </Text>
        </View>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-textSecondary">2 gym valda</Text>
          <Text className="text-sm font-semibold text-textPrimary">
            15 + 15 krediter
          </Text>
        </View>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-textSecondary">3 gym valda</Text>
          <Text className="text-sm font-semibold text-textPrimary">
            10 + 10 + 10 krediter
          </Text>
        </View>
      </View>
      {currentGymCount > 0 && (
        <View className="mt-4 pt-4 border-t border-white/10">
          <View className="bg-primary/10 rounded-2xl p-3">
            <Text className="text-sm font-bold text-primary text-center">
              Aktuellt: {creditPerGym} krediter per gym ({currentGymCount} gym)
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
