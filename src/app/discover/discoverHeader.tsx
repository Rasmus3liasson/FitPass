import { Text, View } from "react-native";

export default function DiscoverHeader() {
  return (
    <View className="px-4 py-4">
      <Text className="text-3xl font-bold text-textPrimary mb-1">Discover</Text>
      <Text className="text-base text-textSecondary">
        Find the perfect fitness spot
      </Text>
    </View>
  );
}
