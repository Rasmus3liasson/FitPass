import { Clock, MapPin, Star } from "lucide-react-native";
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
          <Star size={16} color="#FFCA28" fill="#FFCA28" />
          <Text className="text-white text-sm font-semibold">
            {rating} ({reviewCount})
          </Text>
        </View>
      </View>
      <Text className="text-white font-bold text-2xl mb-3">{name}</Text>
      <View className="flex-row items-center space-x-2 mb-2">
        <MapPin size={16} color="#A0A0A0" />
        <Text className="text-textSecondary text-sm">{address}</Text>
      </View>
      <View className="flex-row items-center space-x-2 mb-2">
        <Clock size={16} color="#A0A0A0" />
        <Text className="text-textSecondary text-sm">{openingHours}</Text>
      </View>
      <View className="flex-row items-center bg-surface rounded-xl p-3 mt-4">
        <Text className="flex-1 text-white font-semibold text-base">
          Credits Per Visit
        </Text>
        <View className="bg-primary rounded-md px-3 py-1.5">
          <Text className="text-white font-bold text-base">{credits}</Text>
        </View>
      </View>
      <View className="mt-6">
        <Text className="text-white font-bold text-lg mb-3">About</Text>
        <Text className="text-[#E5E5E5] text-sm leading-6">{description}</Text>
      </View>
    </View>
  );
}
