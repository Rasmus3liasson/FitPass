import { getOpenState } from "@/src/utils/openingHours";
import { Text, View } from "react-native";

export function OpenStatus({
  open_hours,
}: {
  open_hours: Record<string, string> | undefined;
}) {
  const open = getOpenState(open_hours);

  let color = "bg-accentRed";
  let label = "Closed";
  switch (open) {
    case "open":
      color = "bg-accentGreen";
      label = "Open";
      break;
    case "closing_soon":
      color = "bg-accentOrange";
      label = "Closing soon";
      break;
    case "closed":
    default:
      color = "bg-accentRed";
      label = "Closed";
      break;
  }

  return (
    <View className="flex-row items-center gap-1">
      <View className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <Text className="text-xs text-textSecondary">{label}</Text>
    </View>
  );
}
