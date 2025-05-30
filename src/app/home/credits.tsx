import { ProgressCircle } from "@/src/components/ProgressCircle";
import { Text, View } from "react-native";

export const Credits = () => (
  <View className="bg-surface rounded-2xl px-5 py-6 mx-4 mb-6">
    <View className="flex-row justify-between items-center mb-5">
      <Text className="text-lg font-bold text-textPrimary">
        Monthly Credits
      </Text>
      <Text className="text-sm text-textSecondary">June 2025</Text>
    </View>
    <View className="flex-row items-center">
      <ProgressCircle
        percentage={65}
        radius={40}
        strokeWidth={8}
        color="#6366F1"
        textColor="#FFFFFF"
      />
      <View className="flex-1 ml-5">
        <View className="mb-3">
          <Text className="text-lg font-bold text-textPrimary mb-1">13/20</Text>
          <Text className="text-sm text-textSecondary">Credits Left</Text>
        </View>
        <View>
          <Text className="text-lg font-bold text-textPrimary mb-1">7</Text>
          <Text className="text-sm text-textSecondary">Visits Made</Text>
        </View>
      </View>
    </View>
  </View>
);
