import { BackButton } from '../Button';
import colors from '../../constants/custom-colors';
import { City } from '../../hooks/useCities';
import { CaretDown, MapPin } from 'phosphor-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

interface MapHeaderProps {
  isLoadingLocation: boolean;
  isUsingCustomLocation: boolean;
  selectedCity: City | null;
  locationAddress?: string;
  onLocationPress: () => void;
}

export const MapHeader = ({
  isLoadingLocation,
  isUsingCustomLocation,
  selectedCity,
  locationAddress,
  onLocationPress,
}: MapHeaderProps) => {
  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-background">
      <BackButton />
      <TouchableOpacity
        className="flex-row items-center bg-surface rounded-full px-3 py-2 border border-primary space-x-2"
        onPress={onLocationPress}
      >
        <View className="flex justify-between flex-row gap-2">
          <MapPin size={16} color={colors.primary} />
          <Text className="text-textPrimary text-sm font-medium max-w-[120px]" numberOfLines={1}>
            {isUsingCustomLocation && selectedCity
              ? selectedCity.name
              : locationAddress || 'Hämtar plats...'}
          </Text>
          <CaretDown size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {/* Placeholder for future content */}
      <TouchableOpacity className="rounded-xl w-10 h-10 items-center justify-center shadow-lg"></TouchableOpacity>
    </View>
  );
};
