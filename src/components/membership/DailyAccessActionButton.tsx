import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CustomAlert } from "../CustomAlert";

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
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "default" | "destructive" | "warning";
    buttons: Array<{ text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }>;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "default",
    buttons: []
  });

  const handleSelectGymsWithConfirmation = () => {
    if (hasCurrentGyms && !isFirstTime) {
      // Show confirmation for changes
      setAlertConfig({
        visible: true,
        title: "Bekräfta ändringar",
        message: "Vill du ändra dina valda gym? Ändringar träder i kraft nästa faktureringscykel.",
        type: "warning",
        buttons: [
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
      });
    } else {
      // First time selection or no current gyms
      if (isFirstTime) {
        setAlertConfig({
          visible: true,
          title: "Välj dina gym",
          message: "Du kan välja upp till 3 gym för din Daily Access. Du kan ändra ditt val fram till nästa faktureringsdatum.",
          type: "default",
          buttons: [
            {
              text: "Fortsätt",
              onPress: onSelectGyms,
            },
          ]
        });
      } else {
        onSelectGyms();
      }
    }
  };



  return (
    <View>
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}
