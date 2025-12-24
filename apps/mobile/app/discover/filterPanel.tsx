import { FilterChip } from "@shared/components/FilterChip";
import { Text, TouchableOpacity, View } from "react-native";

interface FiltersPanelProps {
  categories: { id: string; name: string }[];
  selectedCategories: string[];
  toggleCategory: (id: string) => void;
  amenities: { id: string; name: string }[];
  selectedAmenities: string[];
  toggleAmenity: (id: string) => void;
  clearFilters: () => void;
}

export function FiltersPanel({
  categories,
  selectedCategories,
  toggleCategory,
  amenities,
  selectedAmenities,
  toggleAmenity,
  clearFilters,
}: FiltersPanelProps) {
  return (
    <View className="bg-surface rounded-2xl mx-4 p-4 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-textPrimary">Filters</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text className="text-sm text-primary">Clear All</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-base font-semibold text-textPrimary mb-3">Facility Type</Text>
      <View className="flex-row flex-wrap space-x-2 space-y-2 mb-4">
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            selected={selectedCategories.includes(category.id)}
            onPress={() => toggleCategory(category.id)}
          />
        ))}
      </View>

      <Text className="text-base font-semibold text-textPrimary mb-3">Amenities</Text>
      <View className="flex-row flex-wrap space-x-2 space-y-2">
        {amenities.map((amenity) => (
          <FilterChip
            key={amenity.id}
            label={amenity.name}
            selected={selectedAmenities.includes(amenity.id)}
            onPress={() => toggleAmenity(amenity.id)}
          />
        ))}
      </View>
    </View>
  );
}
