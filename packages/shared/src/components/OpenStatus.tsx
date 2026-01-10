import { Text, View } from "react-native";
import { getOpenState } from "../utils/openingHours";

export function OpenStatus({
  open_hours,
}: {
  open_hours: Record<string, string> | undefined;
}) {
  const open = getOpenState(open_hours);

  let color = "bg-accentRed";
  let label = "Stängt";
  switch (open) {
    case "open":
      color = "bg-accentGreen";
      label = "Öppet";
      break;
    case "closing_soon":
      color = "bg-accentOrange";
      label = "Stänger snart";
      break;
    case "closed":
    default:
      color = "bg-accentRed";
      label = "Stängt";
      break;
  }

  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-xs text-textSecondary">{label}</Text>
      <View className={`w-1.5 h-1.5 rounded-full ${color}`} />
    </View>
  );
}
