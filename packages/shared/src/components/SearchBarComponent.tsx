import { Search, X } from "lucide-react-native";
import { TextInput, TouchableOpacity, View } from "react-native";

interface ReusableSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBarComponent({
  searchQuery,
  setSearchQuery,
  placeholder = "Sök...",
  className = "",
}: ReusableSearchBarProps) {
  return (
    <View className={`flex-row items-center bg-surface rounded-xl px-3 py-2 space-x-2 ${className}`}>
      <Search size={20} color="#A0A0A0" />
      <TextInput
        className="flex-1 text-base text-textPrimary pl-2"
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <X size={18} color="#A0A0A0" />
        </TouchableOpacity>
      )}
    </View>
  );
}
