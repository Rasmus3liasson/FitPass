import { Calendar } from "lucide-react-native";
import { Text, View } from "react-native";

interface BillingInfoCardProps {
  currentPeriodEnd?: string;
}

export function BillingInfoCard({ currentPeriodEnd }: BillingInfoCardProps) {
  return (
    <View className="bg-primary/5 rounded-2xl p-4 mb-6 border border-primary/20">
      <View className="flex-row items-center mb-2">
        <Calendar size={16} color="#6366F1" />
        <Text className="font-semibold text-primary ml-2">Viktigt att veta</Text>
      </View>
      <Text className="text-sm text-textPrimary mb-2">
        Du kan göra ändringar fram till:{' '}
        <Text className="font-medium">
          {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString('sv-SE') : 'Nästa faktureringsdatum'}
        </Text>
      </Text>
      <Text className="text-xs text-textSecondary">
        Om inga ändringar görs fortsätter dina nuvarande val automatiskt nästa period.
      </Text>
    </View>
  );
}