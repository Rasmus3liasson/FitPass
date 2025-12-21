import { Section } from "@/components/Section";
import { Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface DangerZoneSettingsProps {
  onDeleteAccount: () => void;
}

export function DangerZoneSettings({ onDeleteAccount }: DangerZoneSettingsProps) {
  return (
    <Section title="Farlig zon">
      <View className="bg-red-500/10 border border-red-500/20 rounded-3xl mx-4 mt-4 px-6 py-3">
        <TouchableOpacity
          className="flex-row items-center py-4"
          onPress={onDeleteAccount}
        >
          <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-red-500/20">
            <Trash2 size={20} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-red-500 text-base font-medium mb-1">
              Radera konto
            </Text>
            <Text className="text-textSecondary text-sm">
              Ta bort ditt konto och all associerad data permanent
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Section>
  );
}
