import { View } from 'react-native';
import { Section } from '../Section';
import { LabelSetting } from '../ui/LabelSetting';

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
          onPress={onExportData}
          showBorder={true}
        />
        <LabelSetting
          label="Offlineläge"
          description="Använd appen utan internetanslutning"
          value={offlineMode}
          onValueChange={onOfflineModeChange}
          showBorder={true}
        />
        <LabelSetting
          label="Rensa cache"
          description="Frigör lagringsutrymme"
          onPress={onClearCache}
        />
      </View>
    </Section>
  );
}
