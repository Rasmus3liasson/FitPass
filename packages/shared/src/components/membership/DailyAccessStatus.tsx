import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../config/constants';
import { type SelectedGym } from '../../hooks/useDailyAccess';
import { useNavigation } from '../../services/navigationService';
import { FacilityCard } from '../FacilityCard';

type EnrichedGym = SelectedGym & {
  clubData?: any;
};

interface DailyAccessStatusProps {
  enrichedCurrentGyms: EnrichedGym[];
  onBack: () => void;
}

export function DailyAccessStatus({ enrichedCurrentGyms, onBack }: DailyAccessStatusProps) {
  const navigation = useNavigation();

  const handleGymPress = (gymId: string) => {
    navigation.push(ROUTES.FACILITY(gymId));
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border/50">
        <Text className="text-textPrimary text-xl font-bold mb-2">Daily Access Status</Text>
        <Text className="text-textSecondary text-sm">Dina aktuella gym-val för Daily Access</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Current Gyms */}
        {enrichedCurrentGyms.length > 0 ? (
          <View className="bg-white rounded-2xl border border-border/30 mb-6 mt-4">
            <Text className="text-textPrimary font-semibold text-base px-4 pt-4 mb-3">
              Dina valda gym ({enrichedCurrentGyms.length}/3)
            </Text>
            {enrichedCurrentGyms.map((gym) => (
              <View key={gym.gym_id} className="mb-3">
                <FacilityCard
                  name={gym.clubData?.name || gym.gym_name}
                  type={gym.clubData?.type || 'Gym'}
                  image={gym.clubData?.avatar_url || ''}
                  rating={gym.clubData?.avg_rating || 0}
                  distance={`${gym.gym_address}`}
                  open_hours={gym.clubData?.open_hours}
                  onPress={() => handleGymPress(gym.gym_id)}
                  layout="list"
                  club_images={gym.clubData?.club_images}
                  avatar_url={gym.clubData?.avatar_url}
                  credits={gym.clubData?.credits}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-gray-50 rounded-2xl p-6 mb-6 mt-4">
            <Text className="text-textPrimary font-semibold text-base mb-2">Inga gym valda</Text>
            <Text className="text-textSecondary text-sm">
              Du har inte valt några gym för Daily Access än.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-6 pb-6 pt-4 bg-background border-t border-border/50">
        <TouchableOpacity
          onPress={onBack}
          className="bg-primary rounded-2xl py-4 items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">Tillbaka till översikt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
