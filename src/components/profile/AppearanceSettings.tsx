import { Section } from "@/components/Section";
import { LabelSetting } from "@/src/components/ui/LabelSetting";
import { Moon, Sun } from "lucide-react-native";
import { View } from "react-native";

interface AppearanceSettingsProps {
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
}

export function AppearanceSettings({
  darkMode,
  onDarkModeChange,
}: AppearanceSettingsProps) {
  return (
    <Section title="Utseende">
      <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
        <LabelSetting
          label="Mörkt läge"
          description="Använd mörkt tema i hela appen"
          icon={darkMode ? Moon : Sun}
          value={darkMode}
          onValueChange={onDarkModeChange}
        />
      </View>
    </Section>
  );
}
