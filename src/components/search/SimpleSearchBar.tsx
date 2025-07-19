import { Search, X } from "lucide-react-native";
import React from "react";
import {
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import colors from "../../constants/custom-colors";

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
  placeholder = "Search facilities...",
}) => {
  return (
    <View className="flex-row items-center bg-surface rounded-xl px-4 py-2">
      <Search size={20} color={colors.textSecondary} />
      <TextInput
        className="flex-1 ml-2 text-white"
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
      {value ? (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
