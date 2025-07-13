import { isOpenNow } from "@/src/utils/openingHours";
import { Text, View } from "react-native";

export function OpenStatus({
  open_hours,
}: {
  open_hours: Record<string, string> | undefined;
}) {
  const open = isOpenNow(open_hours);
  

  return (
    <View className="flex-row items-center gap-1">
      <View
        className={`w-1.5 h-1.5 rounded-full ${
          open ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <Text className="text-xs text-textSecondary">
        {open ? "Open" : "Closed"}
      </Text>
    </View>
  );
}
