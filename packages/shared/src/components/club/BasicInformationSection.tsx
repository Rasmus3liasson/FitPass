import colors from '@fitpass/shared/constants/custom-colors';
import { Buildings } from 'phosphor-react-native';
import { Text, TextInput, View } from 'react-native';
import { ClubTypeDropdown } from '../ClubTypeDropdown';

interface BasicInformationSectionProps {
  name: string;
  type: string;
  description: string;
  onNameChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  name,
  type,
  description,
  onNameChange,
  onTypeChange,
  onDescriptionChange,
}) => {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-textPrimary text-lg font-semibold">Grundläggande Information</Text>
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <Buildings size={16} color={colors.primary} />
        </View>
      </View>

      {/* Club Name */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-2 font-medium">Klubbnamn *</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
          placeholder="Ange ditt klubbnamn"
          placeholderTextColor={colors.borderGray}
          value={name}
          onChangeText={onNameChange}
        />
      </View>

      {/* Club Type */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-2 font-medium">Klubbtyp *</Text>
        <ClubTypeDropdown
          value={type}
          onValueChange={onTypeChange}
          placeholder="Välj din klubbtyp"
        />
      </View>

      {/* Description */}
      <View>
        <Text className="text-textPrimary mb-2 font-medium">Beskrivning</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
          placeholder="Berätta för folk om din klubb..."
          placeholderTextColor={colors.borderGray}
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );
};
