import colors from '@fitpass/shared/constants/custom-colors';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NewsType, NewsTypeOptions } from '../../../constants/newsletter';

interface NewsTypeSelectorProps {
  selectedType: NewsType;
  onTypeChange: (type: NewsType) => void;
  customType?: string;
  onCustomTypeChange?: (value: string) => void;
}

export function NewsTypeSelector({
  selectedType,
  onTypeChange,
  customType,
  onCustomTypeChange,
}: NewsTypeSelectorProps) {
  return (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {NewsTypeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => onTypeChange(option.key)}
            className={`px-4 py-2 rounded-full flex-row items-center ${
              selectedType === option.key ? 'bg-primary' : 'bg-background/70'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                selectedType === option.key ? 'text-textPrimary' : 'text-textSecondary'
              }`}
            >
              {option.label}
            </Text>
            {/* <Text className="ml-2">{option.icon}</Text> */}
          </TouchableOpacity>
        ))}
      </View>

      {selectedType === 'other' && onCustomTypeChange && (
        <View className="mt-3">
          <Text className="text-textSecondary text-sm mb-2">Anpassad kategori</Text>
          <View className="bg-background rounded-xl p-3">
            <TextInput
              className="text-textPrimary text-base"
              placeholder="Ange kategorinamn..."
              value={customType}
              onChangeText={onCustomTypeChange}
              style={{ color: colors.textPrimary }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
export default NewsTypeSelector;
