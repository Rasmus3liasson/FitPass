import colors from '@shared/constants/custom-colors';
import { Text, TextInput, View } from 'react-native';

interface NewsFormInputsProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
}

export function NewsFormInputs({
  title,
  setTitle,
  description,
  setDescription,
  content,
  setContent,
}: NewsFormInputsProps) {
  return (
    <>
      <View className="mb-4">
        <Text className="text-textSecondary text-sm mb-2">
          Rubrik <Text className="text-accentRed">*</Text>
        </Text>
        <View className="bg-background rounded-xl p-3">
          <TextInput
            className="text-textPrimary text-base"
            placeholder="Ange en rubrik..."
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-textSecondary text-sm mb-2">
          Kort beskrivning <Text className="text-accentRed">*</Text>
        </Text>
        <View className="bg-background rounded-xl p-3">
          <TextInput
            className="text-textPrimary text-base"
            placeholder="En kort sammanfattning..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-textSecondary text-sm mb-2">Fullständigt innehåll (valfritt)</Text>
        <View className="bg-background rounded-xl p-3">
          <TextInput
            className="text-textPrimary text-base"
            placeholder="Ytterligare detaljer..."
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </View>
    </>
  );
}
export default NewsFormInputs;
