import { Plus } from "lucide-react-native";
import { Alert, Text, TouchableOpacity } from "react-native";

interface DailyAccessActionButtonProps {
  hasCurrentGyms: boolean;
  hasPendingGyms: boolean;
  onSelectGyms: () => void;
  isFirstTime?: boolean;
}

export function DailyAccessActionButton({
  hasCurrentGyms,
  hasPendingGyms,
  onSelectGyms,
  isFirstTime = false,
}: DailyAccessActionButtonProps) {

  const handleSelectGymsWithConfirmation = () => {
    if (hasCurrentGyms && !isFirstTime) {
      // Show confirmation for changes
      Alert.alert(
        "Bekräfta ändringar",
        "Vill du ändra dina valda gym? Ändringar träder i kraft nästa faktureringscykel.",
        [
          {
            text: "Avbryt",
            style: "cancel",
          },
          {
            text: "Fortsätt",
            onPress: onSelectGyms,
            style: "default",
          },
        ]
      );
    } else {
      // First time selection or no current gyms
      if (isFirstTime) {
        Alert.alert(
          "Välj dina gym",
          "Du kan välja upp till 3 gym för din Daily Access. Du kan ändra ditt val fram till nästa faktureringsdatum.",
          [
            {
              text: "Fortsätt",
              onPress: onSelectGyms,
            },
          ]
        );
      } else {
        onSelectGyms();
      }
    }
  };



  return (
    <TouchableOpacity
      onPress={handleSelectGymsWithConfirmation}
      className="bg-primary rounded-2xl p-4 flex-row items-center justify-center"
      activeOpacity={0.8}
    >
      <Plus size={20} color="white" />
      <Text className="text-white font-semibold ml-2 text-base">
        {hasCurrentGyms ? "Ändra Val" : "Välj Gym"}
      </Text>
    </TouchableOpacity>
  );
}
