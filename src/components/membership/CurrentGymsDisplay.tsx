import { ROUTES } from "@/src/config/constants";
import { useUserBookings } from "@/src/hooks/useBookings";
import { type SelectedGym } from "@/src/hooks/useDailyAccess";
import { useRouter } from "expo-router";
import { MapPin, Users } from "lucide-react-native";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { OptimizedImage } from "../OptimizedImage";

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface CurrentGymsDisplayProps {
  enrichedCurrentGyms: EnrichedGym[];
  enrichedPendingGyms: EnrichedGym[];
  creditPerGym: number;
  userId?: string;
  membership?: any;
  bookings?: any[];
  onPendingGymOptions?: (gymId: string) => void;
  showPendingOptions?: boolean;
  onGymPress?: (gymId: string) => void;
}

export function CurrentGymsDisplay({
  enrichedCurrentGyms,
  enrichedPendingGyms,
  creditPerGym,
  userId,
  membership,
  bookings: passedBookings,
  onPendingGymOptions,
  showPendingOptions = true,
  onGymPress,
}: CurrentGymsDisplayProps) {
  const router = useRouter();
  
  // Use passed bookings data or fetch if not provided
  const bookingsQuery = useUserBookings(userId || "");
  const bookings = passedBookings || bookingsQuery.data || [];
  
  // Calculate credits used per gym based on actual booking data
  const getCreditsUsed = (gymId: string) => {
    if (!membership || !bookings.length) return 0;
    
    // Filter bookings for this specific gym that consumed credits
    const gymBookings = bookings.filter(booking => 
      booking.club_id === gymId && booking.credits_used > 0
    );
    
    // Calculate total credits used for this gym
    const creditsUsedForGym = gymBookings.reduce((total, booking) => 
      total + (booking.credits_used || 0), 0
    );
    
    console.log(`Credits used for gym ${gymId}:`, {
      gymBookings: gymBookings.length,
      creditsUsedForGym,
      bookings: gymBookings.map(b => ({
        id: b.id,
        gym: b.clubs?.name,
        credits_used: b.credits_used,
        created_at: b.created_at
      }))
    });
    
    return creditsUsedForGym;
  };

  const handleGymPress = (gymId: string) => {
    if (onGymPress) {
      onGymPress(gymId);
    } else {
      router.push(ROUTES.FACILITY(gymId) as any);
    }
  };

  const handlePendingGymOptionsPress = (gymId: string) => {
    const gym = enrichedPendingGyms.find((g) => g.gym_id === gymId);
    const gymName = gym?.clubData?.name || gym?.gym_name || "gymmet";
    
    Alert.alert(
      "Ta bort väntande gym",
      `Vill du ta bort ${gymName} från dina väntande val? Detta kommer att avbryta den planerade ändringen.`,
      [
        {
          text: "Avbryt",
          style: "cancel",
        },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: () => {
            if (onPendingGymOptions) {
              onPendingGymOptions(gymId);
            }
          },
        },
      ]
    );
  };

  // Show empty state if no gyms at all
  if (enrichedCurrentGyms.length === 0 && enrichedPendingGyms.length === 0) {
    return (
      <View className="bg-surface rounded-2xl p-6 mb-6 border border-white/5">
        <View className="items-center">
          <Users size={32} color="#6B7280" />
          <Text className="text-lg font-medium text-textPrimary mt-2">Inga Aktiva Gym</Text>
          <Text className="text-sm text-textSecondary text-center mt-1">
            Välj upp till 3 gym för att aktivera din Daily Access
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Current/Active Gyms */}
      {enrichedCurrentGyms.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-textPrimary">Aktiva Gym</Text>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary">
                {enrichedCurrentGyms.length}/3 valda
              </Text>
            </View>
          </View>
          {enrichedCurrentGyms.map((gym) => {
            const usage = getCreditsUsed(gym.gym_id);
            return (
              <TouchableOpacity
                key={gym.gym_id}
                onPress={() => handleGymPress(gym.gym_id)}
                className="bg-surface rounded-2xl p-5 mb-3 border border-white/5"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  {gym.clubData?.image_url ? (
                    <OptimizedImage
                      source={{ uri: gym.clubData.image_url }}
                      style={{ width: 48, height: 48 }}
                      className="rounded-lg mr-4"
                    />
                  ) : (
                    <View className="w-12 h-12 bg-primary/10 rounded-lg mr-4 items-center justify-center">
                      <MapPin size={24} color="#6366F1" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-textPrimary text-base mb-1">
                      {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <MapPin size={14} color="#6B7280" />
                      <Text className="text-sm text-textSecondary ml-1">
                        {gym.clubData?.city || gym.gym_address || "Okänd plats"}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="bg-primary/10 px-3 py-1 rounded-full mr-2">
                        <Text className="text-xs font-medium text-primary">
                          {creditPerGym} krediter
                        </Text>
                      </View>
                      <View className="bg-white/10 px-3 py-1 rounded-full">
                        <Text className="text-xs text-textSecondary">
                          {usage}/{creditPerGym} använda
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Pending Gyms */}
      {enrichedPendingGyms.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-semibold text-textPrimary mb-3">Väntande Ändringar</Text>
          <View className="bg-orange-500/10 rounded-2xl p-4 border border-accentOrange/20 mb-3">
            <Text className="text-sm font-medium text-accentOrange">
              Aktiveras nästa faktureringscykel
            </Text>
          </View>
          {enrichedPendingGyms.map((gym) => (
            <TouchableOpacity
              key={gym.gym_id}
              onPress={() => handlePendingGymOptionsPress(gym.gym_id)}
              className="bg-surface rounded-2xl p-5 mb-3 border border-accentOrange/20"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                {gym.clubData?.image_url ? (
                  <OptimizedImage
                    source={{ uri: gym.clubData.image_url }}
                    style={{ width: 48, height: 48 }}
                    className="rounded-lg mr-4"
                  />
                ) : (
                  <View className="w-12 h-12 bg-accentOrange/10 rounded-lg mr-4 items-center justify-center">
                    <MapPin size={24} color="#F59E0B" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-textPrimary text-base">
                    {gym.clubData?.name || gym.gym_name || "Okänt Gym"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="text-sm text-textSecondary ml-1">
                      {gym.clubData?.city || gym.gym_address || "Okänd plats"}
                    </Text>
                  </View>
                </View>
                <View className="bg-accentOrange/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-accentOrange">Väntar</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}