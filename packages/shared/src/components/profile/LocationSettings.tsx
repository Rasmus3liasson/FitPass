import { Section } from "@/components/Section";
import { LabelSetting } from "../components/ui/LabelSetting";
import { View } from "react-native";

interface LocationSettingsProps {
  enableLocationServices: boolean;
  defaultLocation: string;
  onEnableLocationServicesChange: (value: boolean) => void;
  onDefaultLocationPress: () => void;
}

export function LocationSettings({
  enableLocationServices,
  defaultLocation,
  onEnableLocationServicesChange,
  onDefaultLocationPress,
}: LocationSettingsProps) {
  return (
    <Section title="Platsinställningar">
      <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
        <LabelSetting
          label="Aktivera platstjänster"
          description={`Tillåt ${process.env.APP_NAME} att använda din plats för exakta avståndsberäkningar till gym`}
          value={enableLocationServices}
          onValueChange={onEnableLocationServicesChange}
          showBorder={true}
        />
        <LabelSetting
          label="Standardplats"
          description={defaultLocation}
          onPress={onDefaultLocationPress}
        />
      </View>
    </Section>
  );
}
