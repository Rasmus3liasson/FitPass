import { Text, TouchableOpacity, View } from "react-native";
import { TargetAudience, TargetAudienceOptions } from "../../../../../../../apps/mobile/constants/newsletter";

interface TargetAudienceSelectorProps {
  selectedAudience: TargetAudience;
  onAudienceChange: (audience: TargetAudience) => void;
}

export function TargetAudienceSelector({
  selectedAudience,
  onAudienceChange,
}: TargetAudienceSelectorProps) {
  return (
    <View className="space-y-2">
      {TargetAudienceOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          onPress={() => onAudienceChange(option.key)}
          className={`p-4 rounded-xl flex-row items-center ${
            selectedAudience === option.key ? "bg-primary/20" : "bg-background"
          }`}
          activeOpacity={0.7}
        >
          <View
            className={`w-5 h-5 rounded-full mr-3 items-center justify-center ${
              selectedAudience === option.key
                ? "bg-primary"
                : "bg-surface border border-borderGray"
            }`}
          >
            {selectedAudience === option.key && (
              <View className="w-2.5 h-2.5 rounded-full bg-textPrimary" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-textPrimary font-medium mb-1">
              {option.label}
            </Text>
            <Text className="text-textSecondary text-sm">
              {option.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
export default TargetAudienceSelector;
