import { Edit3, Plus } from "lucide-react-native";
import { Text, TouchableOpacity } from "react-native";

interface DailyAccessActionButtonProps {
  hasCurrentGyms: boolean;
  hasPendingGyms: boolean;
  onPress: () => void;
}

export function DailyAccessActionButton({
  hasCurrentGyms,
  hasPendingGyms,
  onPress,
}: DailyAccessActionButtonProps) {
  const isFirstTime = !hasCurrentGyms && !hasPendingGyms;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-primary rounded-2xl py-4 flex-row items-center justify-center"
      activeOpacity={0.8}
    >
      {isFirstTime ? (
        <>
          <Plus size={20} color="#ffffff" />
          <Text className="text-white font-bold text-base ml-2">
            Välj dina gym
          </Text>
        </>
      ) : (
        <>
          <Edit3 size={18} color="#ffffff" />
          <Text className="text-white font-bold text-base ml-2">
            Hantera gym-val
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}