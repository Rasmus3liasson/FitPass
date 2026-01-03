import colors from '@shared/constants/custom-colors';
import SearchBarComponent from "@shared/components/SearchBarComponent";
import { Filter, Map } from "phosphor-react-native";
import { TouchableOpacity, View } from "react-native";

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
      <SearchBarComponent
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Sök efter gym eller plats"
        className="flex-1"
      />
      
      <TouchableOpacity
        onPress={toggleFilters}
        className="bg-surface rounded-xl px-3 py-2 items-center justify-center"
      >
        <Filter size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={openMap}
        className="bg-surface rounded-xl px-3 py-2 items-center justify-center"
      >
        <Map size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
