import { Star } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface BookVisitButtonProps {
  onPress: () => void;
  credits: number;
  facilityName?: string;
  isVisible?: boolean;
}

export function BookVisitButton({
  onPress,
  credits,
  facilityName,
  isVisible = true,
}: BookVisitButtonProps) {
  if (!isVisible) return null;

  return (
    <View className="bg-background px-4 pb-6 pt-3">
      <TouchableOpacity
        onPress={onPress}
        className="bg-primary rounded-2xl px-6 py-4 flex-row items-center justify-between"
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
            <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <Text className="text-white font-bold text-lg">Boka besök</Text>
        </View>
        <View className="bg-white/25 rounded-xl px-4 py-2">
          <Text className="text-white font-bold text-base">
            {credits} krediter
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
