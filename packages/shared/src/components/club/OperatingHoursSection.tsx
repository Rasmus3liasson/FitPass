import colors from '@shared/constants/custom-colors';
import { ROUTES } from "../../config/constants";
import { useRouter } from "expo-router";
import { Clock } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface OperatingHoursSectionProps {
  openHours: { [key: string]: string };
  formatOpeningHours: (openHours: { [key: string]: string }) => string;
  hasExistingClub: boolean;
}

export const OperatingHoursSection: React.FC<OperatingHoursSectionProps> = ({
  openHours,
  formatOpeningHours,
  hasExistingClub,
}) => {
  const router = useRouter();

  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-textPrimary text-lg font-semibold">
          Dina öppettider
        </Text>
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <Clock size={16} color={colors.primary} />
        </View>
      </View>

      {/* Display current hours */}
      <View className="mb-4 p-3 bg-background rounded-xl border border-accentGray">
        <Text className="text-textSecondary text-sm mb-2">Öppettider</Text>
        <Text className="text-textPrimary text-base leading-6">
          {formatOpeningHours(openHours)}
        </Text>
        <Text className="text-textSecondary text-xs mt-2">
          {Object.keys(openHours).length} dagar konfigurerade
        </Text>
      </View>

      {/* Edit button */}
      <TouchableOpacity
        className="bg-primary rounded-xl py-3 items-center"
        onPress={() =>
          router.push({
            pathname: ROUTES.EDIT_CLUB_OPEN_HOURS,
            params: {
              open_hours: JSON.stringify(openHours),
              club_exists: hasExistingClub ? "true" : "false",
            },
          } as any)
        }
      >
        <View className="flex-row items-center">
          <Text className="text-textPrimary text-base font-semibold ml-2">
            {hasExistingClub ? "Ändra Öppettider" : "Sätt Öppettider"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
