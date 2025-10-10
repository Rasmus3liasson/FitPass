import { Car, Dumbbell, ShowerHead, Wifi } from "lucide-react-native";
import { Text, View } from "react-native";

export function FacilityAmenities() {
  const amenities = [
    { icon: <Dumbbell size={20} color="#6366F1" />, name: "Equipment" },
    { icon: <ShowerHead size={20} color="#6366F1" />, name: "Showers" },
    { icon: <Car size={20} color="#6366F1" />, name: "Parking" },
    { icon: <Wifi size={20} color="#6366F1" />, name: "Wi-Fi" },
  ];

  return (
    <View className="mt-6">
      <Text className="text-textPrimary font-bold text-lg mb-3">Amenities</Text>
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
