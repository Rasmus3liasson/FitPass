import { Zap } from "lucide-react-native";
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
    <View className="bg-surface rounded-2xl p-5 mb-6 border border-white/5">
      <View className="flex-row items-center mb-3">
        <Zap size={20} color="#6366F1" />
        <Text className="text-lg font-semibold text-textPrimary ml-2">Kreditfördelning</Text>
      </View>
      <Text className="text-textSecondary text-sm mb-3">
        Dina 30 krediter fördelas baserat på valda gym:
      </Text>
      <View className="space-y-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">1 gym valt</Text>
          <Text className="text-sm font-medium text-textPrimary">30 krediter</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">2 gym valda</Text>
          <Text className="text-sm font-medium text-textPrimary">15 + 15 krediter</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-textSecondary">3 gym valda</Text>
          <Text className="text-sm font-medium text-textPrimary">10 + 10 + 10 krediter</Text>
        </View>
      </View>
      {currentGymCount > 0 && (
        <View className="mt-3 pt-3 border-t border-white/10">
          <Text className="text-sm font-medium text-primary">
            Aktuellt: {creditPerGym} krediter per gym ({currentGymCount} gym)
          </Text>
        </View>
      )}
    </View>
  );
}