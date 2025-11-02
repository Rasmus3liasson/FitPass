import { FacilityCard } from "@/src/components/FacilityCard";
import { ROUTES } from "@/src/config/constants";
import { type SelectedGym } from "@/src/hooks/useDailyAccess";
import { useRouter } from "expo-router";
import { MapPin, MoreHorizontal } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface CurrentGymsDisplayProps {
  enrichedCurrentGyms: EnrichedGym[];
  enrichedPendingGyms: EnrichedGym[];
  onPendingGymOptions?: (gymId: string) => void;
  showPendingOptions?: boolean;
}

export function CurrentGymsDisplay({
  enrichedCurrentGyms,
  enrichedPendingGyms,
  onPendingGymOptions,
  showPendingOptions = true,
}: CurrentGymsDisplayProps) {
  const router = useRouter();

  const handleGymPress = (gymId: string) => {
    router.push(ROUTES.FACILITY(gymId) as any);
  };

  const handlePendingGymOptionsPress = (gymId: string) => {
    if (onPendingGymOptions) {
      onPendingGymOptions(gymId);
    }
  };

  // Show empty state if no gyms at all
  if (enrichedCurrentGyms.length === 0 && enrichedPendingGyms.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="bg-gradient-to-b from-gray-50 to-white rounded-3xl p-8 items-center border border-gray-100">
          <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-6">
            <MapPin size={32} color="#6366f1" />
          </View>
          <Text className="text-textPrimary font-bold text-xl mb-3 text-center">
            Välj dina gym
          </Text>
          <Text className="text-textSecondary text-center text-base leading-6 max-w-xs">
            Få tillgång till upp till 3 gym med din Daily Access-medlemskap
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Current/Active Gyms */}
      {enrichedCurrentGyms.length > 0 && (
        <View className="bg-background rounded-2xl p-4 mb-6">
          <Text className="text-textPrimary font-semibold text-lg mb-4">
            Aktiva gym ({enrichedCurrentGyms.length}/3)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {enrichedCurrentGyms.map((gym) => (
              <View key={gym.gym_id} className="mr-3 w-72">
                <FacilityCard
                  name={gym.clubData?.name || gym.gym_name}
                  type={gym.clubData?.type || "Gym"}
                  image={gym.clubData?.avatar_url || ""}
                  distance={`${gym.gym_address}`}
                  open_hours={gym.clubData?.open_hours}
                  onPress={() => handleGymPress(gym.gym_id)}
                  layout="list"
                  club_images={gym.clubData?.club_images}
                  avatar_url={gym.clubData?.avatar_url}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Pending Gyms */}
      {enrichedPendingGyms.length > 0 && (
        <View className="bg-background rounded-2xl p-4 mb-6">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-textPrimary font-semibold text-lg mb-2">
                Väntande gym ({enrichedPendingGyms.length}/3)
              </Text>
              <Text className="text-accentOrange text-sm mb-4">
                Aktiveras nästa faktureringsperiod
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {enrichedPendingGyms.map((gym) => (
              <View key={gym.gym_id} className="mr-3 w-72 relative">
                <FacilityCard
                  name={gym.clubData?.name || gym.gym_name}
                  type={gym.clubData?.type || "Gym"}
                  image={gym.clubData?.avatar_url || ""}
                  distance={`${gym.gym_address}`}
                  onPress={() => handleGymPress(gym.gym_id)}
                  layout="list"
                  club_images={gym.clubData?.club_images}
                  avatar_url={gym.clubData?.avatar_url}
                />
                {/* Options Menu for Pending Gyms */}
                {showPendingOptions && (
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full shadow-lg"
                    onPress={() => handlePendingGymOptionsPress(gym.gym_id)}
                    activeOpacity={0.7}
                  >
                    <MoreHorizontal size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {/* Pending Badge */}
                <View className="absolute top-2 left-2 bg-orange-500 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    Väntande
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
