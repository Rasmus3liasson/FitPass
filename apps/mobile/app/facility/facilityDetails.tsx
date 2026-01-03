import colors from '@shared/constants/custom-colors';
import { Clock, MapPin, Star } from "phosphor-react-native";
import { Text, View } from "react-native";

interface Props {
  facility: {
    type: string;
    name: string;
    rating: number;
    reviewCount: number;
    address: string;
    openingHours: string;
    credits: number;
    description: string;
  };
}

export function FacilityDetails({ facility }: Props) {
  const {
    name,
    type,
    rating,
    reviewCount,
    address,
    openingHours,
    credits,
    description,
  } = facility;

  return (
    <View>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-primary font-semibold text-sm">{type}</Text>
        <View className="flex-row items-center space-x-1">
          <Star size={16} color={colors.accentYellow} fill={colors.accentYellow} />
          <Text className="text-textPrimary text-sm font-semibold">
            {rating} ({reviewCount})
          </Text>
        </View>
      </View>
      <Text className="text-textPrimary font-bold text-2xl mb-3">{name}</Text>
      <View className="flex-row items-center space-x-2 mb-2">
        <MapPin size={16} color={colors.textSecondary} />
        <Text className="text-textSecondary text-sm">{address}</Text>
      </View>
      <View className="flex-row items-center space-x-2 mb-2">
        <Clock size={16} color={colors.textSecondary} />
        <Text className="text-textSecondary text-sm">{openingHours}</Text>
      </View>
      <View className="flex-row items-center bg-surface rounded-xl p-3 mt-4">
        <Text className="flex-1 text-textPrimary font-semibold text-base">
          Credits Per Visit
        </Text>
        <View className="bg-primary rounded-md px-3 py-1.5">
          <Text className="text-textPrimary font-bold text-base">{credits}</Text>
        </View>
      </View>
      <View className="mt-6">
        <Text className="text-textPrimary font-bold text-lg mb-3">About</Text>
        <Text className="text-[#E5E5E5] text-sm leading-6">{description}</Text>
      </View>
    </View>
  );
}
