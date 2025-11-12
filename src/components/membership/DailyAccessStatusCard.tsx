import { Calendar } from "lucide-react-native";
import { Text, View } from "react-native";

interface DailyAccessStatusCardProps {
  isNewUser: boolean;
  hasPendingGyms: boolean;
  currentPeriodEnd?: string;
}

export function DailyAccessStatusCard({
  isNewUser,
  hasPendingGyms,
  currentPeriodEnd,
}: DailyAccessStatusCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "nästa faktureringsperiod";
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isNewUser) {
    return (
      <View className="bg-green-50 rounded-2xl p-4 mb-6 mt-4">
        <View className="flex-row items-center mb-2">
          <Calendar size={16} color="#10b981" />
          <Text className="text-accentGreen text-sm font-semibold ml-2">
            Omedelbar aktivering
          </Text>
        </View>
        <Text className="text-accentGreen text-sm">
          Nya val aktiveras direkt utan väntetid
        </Text>
      </View>
    );
  }

  if (hasPendingGyms) {
    return (
      <View className="bg-transparent rounded-2xl p-4 mb-6 mt-4">
        <View className="flex-row items-center mb-2">
          <Text className="text-accentOrange text-sm font-semibold">
            Väntande ändringar
          </Text>
        </View>
        <Text className="text-accentOrange text-sm">
          Ändringar träder i kraft {formatDate(currentPeriodEnd || "")}
        </Text>
      </View>
    );
  }

  return null;
}