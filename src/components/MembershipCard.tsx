import { LinearGradient } from "expo-linear-gradient";
import { Calendar, ChevronRight, CreditCard } from "lucide-react-native";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";

interface MembershipCardProps {
  type: string;
  startDate: string;
  credits: number;
  creditsUsed: number;
  onPress: () => void;
}

export function MembershipCard({
  type,
  startDate,
  credits,
  creditsUsed,
  onPress,
}: MembershipCardProps) {
  const width = Dimensions.get("window").width - 32;
  const progressWidth = (creditsUsed / credits) * (width - 32);

  return (
    <TouchableOpacity
      className="rounded-2xl overflow-hidden mt-4"
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={["#6366F1", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-2xl"
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center space-x-2">
              <CreditCard size={16} color="#FFFFFF" />
              <Text className="text-white font-bold text-base">
                {type} Membership
              </Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </View>

          {/* Info */}
          <View className="mb-6">
            <Text className="text-xs text-white/70 mb-3">
              Member since {startDate}
            </Text>
            <Text className="text-sm font-semibold text-white mb-2">
              Monthly Credits
            </Text>

            <View className="mt-2">
              <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full bg-white rounded-full"
                  style={{ width: progressWidth }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-white/70">
                  Used: {creditsUsed}
                </Text>
                <Text className="text-xs text-white/70">Total: {credits}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="border-t border-white/20 pt-3">
            <View className="flex-row items-center space-x-2">
              <Calendar size={14} color="#FFFFFF" />
              <Text className="text-xs text-white">Renews July 10, 2025</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
