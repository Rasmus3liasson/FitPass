import { Search, View, X } from "lucide-react-native";
import { TextInput, TouchableOpacity } from "react-native";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  toggleFilters: () => void;
  openMap: () => void;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  toggleFilters,
  openMap,
}: SearchBarProps) {
  return (
    <View className="flex-row px-4 mb-4 space-x-3 w-full">
      <View className="flex-1 flex-row items-center bg-surface rounded-xl px-3 py-2 space-x-2">
        <Search size={20} color="#A0A0A0" />
        <TextInput
          className="flex-1 text-base text-textPrimary p-0"
          placeholder="Search facilities or classes"
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
    </View>
  );
}
