import { MagnifyingGlass, X } from 'phosphor-react-native';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../../constants/custom-colors';

interface SimpleSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SimpleSearchBar: React.FC<SimpleSearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search facilities...',
}) => {
  return (
    <View className="flex-row items-center bg-surface/30 backdrop-blur-sm border border-surface/20 rounded-2xl px-4 py-3 shadow-lg">
      <MagnifyingGlass size={22} color={colors.textSecondary} />
      <TextInput
        className="flex-1 ml-3 text-textPrimary text-base"
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          if (value.trim()) {
            onSearch(value);
          }
        }}
        returnKeyType="search"
      />
      <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
        {value ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            className="bg-surface/40 p-1 rounded-full"
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};
