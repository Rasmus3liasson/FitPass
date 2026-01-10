import colors from "@shared/constants/custom-colors";
import { BarbellIcon, CarIcon, NetworkIcon, ShowerIcon } from "phosphor-react-native";
import { Text, View } from "react-native";

export function FacilityAmenities() {
  const amenities = [
    { icon: <BarbellIcon size={20} color={colors.primary} />, name: "Equipment" },
    { icon: <ShowerIcon size={20} color={colors.primary} />, name: "Showers" },
    { icon: <CarIcon size={20} color={colors.primary} />, name: "Parking" },
    { icon: <NetworkIcon size={20} color={colors.primary} />, name: "Wi-Fi" },
  ];

  return (
    <View className="mt-6">
      <Text className="text-textPrimary font-bold text-lg mb-3">Faciliteten</Text>
      <View className="flex-row flex-wrap gap-4">
        {amenities.map((item, idx) => (
          <View key={idx} className="items-center w-[70px]">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
              {item.icon}
            </View>
            <Text className="text-textPrimary text-xs text-center">{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export default FacilityAmenities;
