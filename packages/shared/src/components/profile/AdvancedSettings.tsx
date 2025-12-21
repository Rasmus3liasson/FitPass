import { Section } from "@/components/Section";
import { LabelSetting } from "../components/ui/LabelSetting";
import { Globe, Shield, Trash2 } from "lucide-react-native";
import { View } from "react-native";

interface AdvancedSettingsProps {
  offlineMode: boolean;
  onOfflineModeChange: (value: boolean) => void;
  onExportData: () => void;
  onClearCache: () => void;
}

export function AdvancedSettings({
  offlineMode,
  onOfflineModeChange,
  onExportData,
  onClearCache,
}: AdvancedSettingsProps) {
  return (
    <Section title="Avancerade inställningar">
      <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
        <LabelSetting
          label="Exportera data"
          description="Ladda ner en kopia av din data"
          icon={Shield}
          onPress={onExportData}
          showBorder={true}
        />
        <LabelSetting
          label="Offlineläge"
          description="Använd appen utan internetanslutning"
          icon={Globe}
          value={offlineMode}
          onValueChange={onOfflineModeChange}
          showBorder={true}
        />
        <LabelSetting
          label="Rensa cache"
          description="Frigör lagringsutrymme"
          icon={Trash2}
          onPress={onClearCache}
        />
      </View>
    </Section>
  );
}
