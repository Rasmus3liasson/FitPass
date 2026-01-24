import colors from '@shared/constants/custom-colors';
import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';

import { TextInput, TouchableOpacity, View } from 'react-native';

interface ReusableSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBarComponent({
  searchQuery,
  setSearchQuery,
  placeholder = 'Sök...',
  className = '',
}: ReusableSearchBarProps) {
  return (
    <View
      className={`flex-row items-center bg-surface rounded-xl px-3 py-2 space-x-2 ${className}`}
    >
      <MagnifyingGlassIcon size={20} color={colors.textSecondary} />
      <TextInput
        className="flex-1 h-full text-base text-textPrimary pl-2 mb-2"
        textAlignVertical="center"
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <XIcon size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
