import { Building2 } from "lucide-react-native";
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
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Building2 size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Basic Information</Text>
      </View>
      
      {/* Club Name */}
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Club Name *</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
          placeholder="Enter your club name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={onNameChange}
        />
      </View>

      {/* Club Type */}
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Club Type *</Text>
        <ClubTypeDropdown
          value={type}
          onValueChange={onTypeChange}
          placeholder="Select your club type"
        />
      </View>

      {/* Description */}
      <View>
        <Text className="text-white mb-2 font-medium">Description</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
          placeholder="Tell people about your club..."
          placeholderTextColor="#9CA3AF"
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
