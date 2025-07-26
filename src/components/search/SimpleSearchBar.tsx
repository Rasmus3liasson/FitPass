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
    <View className="flex-row items-center bg-surface/30 backdrop-blur-sm border border-surface/20 rounded-2xl px-4 py-3 shadow-lg">
      <Search size={22} color={colors.textSecondary} />
      <TextInput
        className="flex-1 ml-3 text-white text-base"
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
        <TouchableOpacity 
          onPress={() => onChangeText("")}
          className="bg-surface/40 p-1 rounded-full ml-2"
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
