import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    Clock,
    Filter,
    Save,
    Star,
    Trash2,
    X
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface AdvancedFilters {
  categories: string[];
  amenities: string[];
  distance: number;
  rating: number;
  priceRange: [number, number];
  openNow: boolean;
  hasClasses: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedFilters;
  createdAt: string;
}

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  categories: FilterOption[];
  amenities: FilterOption[];
  initialFilters?: Partial<AdvancedFilters>;
}

const SAVED_FILTERS_KEY = "fitpass_saved_filters";

const defaultFilters: AdvancedFilters = {
  categories: [],
  amenities: [],
  distance: 25, // km
  rating: 0,
  priceRange: [1, 5], // credits
  openNow: false,
  hasClasses: false,
};

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  categories,
  amenities,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<AdvancedFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  useEffect(() => {
    loadSavedFilters();
  }, []);

  useEffect(() => {
    if (visible) {
      setFilters({ ...defaultFilters, ...initialFilters });
    }
  }, [visible, initialFilters]);

  const loadSavedFilters = async () => {
    try {
      const data = await AsyncStorage.getItem(SAVED_FILTERS_KEY);
      if (data) {
        setSavedFilters(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  };

  const saveFilter = async () => {
    if (!filterName.trim()) return;

    try {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name: filterName.trim(),
        filters,
        createdAt: new Date().toISOString(),
      };

      const updatedFilters = [newFilter, ...savedFilters];
      await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
      setSavedFilters(updatedFilters);
      setFilterName("");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving filter:", error);
    }
  };

  const deleteSavedFilter = async (filterId: string) => {
    try {
      const updatedFilters = savedFilters.filter(f => f.id !== filterId);
      await AsyncStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
      setSavedFilters(updatedFilters);
    } catch (error) {
      console.error("Error deleting saved filter:", error);
    }
  };

  const applySavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.amenities.length > 0 ||
      filters.distance !== defaultFilters.distance ||
      filters.rating !== defaultFilters.rating ||
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1] ||
      filters.openNow !== defaultFilters.openNow ||
      filters.hasClasses !== defaultFilters.hasClasses
    );
  };

  const renderFilterChips = (
    items: FilterOption[],
    selectedIds: string[],
    onToggle: (id: string) => void
  ) => (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => onToggle(item.id)}
          className={`px-3 py-2 rounded-full border ${
            selectedIds.includes(item.id)
              ? "bg-primary border-primary"
              : "bg-transparent border-borderGray"
          }`}
        >
          <Text
            className={`text-sm ${
              selectedIds.includes(item.id) ? "text-white" : "text-textSecondary"
            }`}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-borderGray">
          <View className="flex-row items-center">
            <Filter size={24} color="#FFFFFF" />
            <Text className="text-white text-xl font-bold ml-2">Advanced Filters</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <View className="py-4">
              <Text className="text-white text-lg font-semibold mb-3">Saved Filters</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {savedFilters.map((savedFilter) => (
                    <View key={savedFilter.id} className="bg-surface rounded-xl p-3 min-w-32">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-white font-medium" numberOfLines={1}>
                          {savedFilter.name}
                        </Text>
                        <TouchableOpacity onPress={() => deleteSavedFilter(savedFilter.id)}>
                          <Trash2 size={16} color="#A0A0A0" />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => applySavedFilter(savedFilter)}
                        className="bg-primary rounded-lg py-2 px-3"
                      >
                        <Text className="text-white text-sm text-center">Apply</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Categories */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">Categories</Text>
            {renderFilterChips(categories, filters.categories, toggleCategory)}
          </View>

          {/* Amenities */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">Amenities</Text>
            {renderFilterChips(amenities, filters.amenities, toggleAmenity)}
          </View>

          {/* Distance */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">
              Distance: {filters.distance} km
            </Text>
            <View className="bg-surface rounded-xl p-4">
              <View className="flex-row flex-wrap gap-2">
                {[1, 5, 10, 15, 25, 50].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    onPress={() => setFilters(prev => ({ ...prev, distance }))}
                    className={`px-4 py-3 rounded-lg border ${
                      filters.distance === distance
                        ? "bg-primary border-primary"
                        : "bg-transparent border-borderGray"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        filters.distance === distance ? "text-white" : "text-textSecondary"
                      }`}
                    >
                      {distance} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Rating */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">
              Minimum Rating: {filters.rating > 0 ? `${filters.rating}+` : "Any"}
            </Text>
            <View className="bg-surface rounded-xl p-4">
              <View className="flex-row flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFilters(prev => ({ ...prev, rating }))}
                    className={`px-3 py-2 rounded-lg border flex-row items-center ${
                      filters.rating === rating
                        ? "bg-primary border-primary"
                        : "bg-transparent border-borderGray"
                    }`}
                  >
                    <Star 
                      size={16} 
                      color={filters.rating === rating ? "#FFFFFF" : "#A0A0A0"}
                      fill={filters.rating === rating ? "#FFFFFF" : "transparent"}
                    />
                    <Text
                      className={`text-sm ml-1 ${
                        filters.rating === rating ? "text-white" : "text-textSecondary"
                      }`}
                    >
                      {rating === 0 ? "Any" : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Price Range */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">
              Credits: {filters.priceRange[0]} - {filters.priceRange[1]}
            </Text>
            <View className="bg-surface rounded-xl p-4">
              <Text className="text-white font-medium mb-3">Min Credits</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((price) => (
                  <TouchableOpacity
                    key={`min-${price}`}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      priceRange: [price, Math.max(price, prev.priceRange[1])],
                    }))}
                    className={`px-3 py-2 rounded-lg border ${
                      filters.priceRange[0] === price
                        ? "bg-primary border-primary"
                        : "bg-transparent border-borderGray"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        filters.priceRange[0] === price ? "text-white" : "text-textSecondary"
                      }`}
                    >
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text className="text-white font-medium mb-3">Max Credits</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((price) => (
                  <TouchableOpacity
                    key={`max-${price}`}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      priceRange: [Math.min(price, prev.priceRange[0]), price],
                    }))}
                    className={`px-3 py-2 rounded-lg border ${
                      filters.priceRange[1] === price
                        ? "bg-primary border-primary"
                        : "bg-transparent border-borderGray"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        filters.priceRange[1] === price ? "text-white" : "text-textSecondary"
                      }`}
                    >
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Toggle Options */}
          <View className="py-4">
            <Text className="text-white text-lg font-semibold mb-3">Options</Text>
            <View className="bg-surface rounded-xl overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-borderGray">
                <View className="flex-row items-center">
                  <Clock size={20} color="#A0A0A0" />
                  <Text className="text-white ml-3">Open Now</Text>
                </View>
                <Switch
                  value={filters.openNow}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, openNow: value }))
                  }
                  trackColor={{ false: "#3e3e3e", true: "rgba(99, 102, 241, 0.4)" }}
                  thumbColor="#6366F1"
                />
              </View>
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center">
                  <Star size={20} color="#A0A0A0" />
                  <Text className="text-white ml-3">Has Classes</Text>
                </View>
                <Switch
                  value={filters.hasClasses}
                  onValueChange={(value) =>
                    setFilters(prev => ({ ...prev, hasClasses: value }))
                  }
                  trackColor={{ false: "#3e3e3e", true: "rgba(99, 102, 241, 0.4)" }}
                  thumbColor="#6366F1"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-4 py-6 border-t border-borderGray bg-background">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowSaveDialog(true)}
              className={`flex-1 rounded-2xl py-4 flex-row items-center justify-center border ${
                hasActiveFilters() 
                  ? "bg-surface border-primary" 
                  : "bg-surface border-borderGray"
              }`}
              disabled={!hasActiveFilters()}
            >
              <Save size={18} color={hasActiveFilters() ? "#6366F1" : "#A0A0A0"} />
              <Text className={`ml-2 font-semibold ${hasActiveFilters() ? "text-primary" : "text-textSecondary"}`}>
                Save
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                resetFilters();
                onClose();
              }}
              className={`flex-1 rounded-2xl py-4 border ${
                hasActiveFilters() 
                  ? "bg-surface border-red-500" 
                  : "bg-surface border-borderGray"
              }`}
              disabled={!hasActiveFilters()}
            >
              <Text className={`text-center font-semibold ${
                hasActiveFilters() ? "text-red-400" : "text-textSecondary"
              }`}>
                Reset
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                onApplyFilters(filters);
                onClose();
              }}
              className="flex-2 bg-primary rounded-2xl py-4 shadow-lg"
              style={{
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-white text-center font-bold text-base">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Filter Dialog */}
        <Modal
          visible={showSaveDialog}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaveDialog(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-4">
            <View className="bg-surface rounded-xl p-6 w-full max-w-sm">
              <Text className="text-white text-lg font-bold mb-4">Save Filter</Text>
              <TextInput
                className="bg-background rounded-lg px-4 py-3 text-white mb-4"
                placeholder="Filter name..."
                placeholderTextColor="#A0A0A0"
                value={filterName}
                onChangeText={setFilterName}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowSaveDialog(false)}
                  className="flex-1 bg-background rounded-lg py-3"
                >
                  <Text className="text-textSecondary text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveFilter}
                  className="flex-1 bg-primary rounded-lg py-3"
                  disabled={!filterName.trim()}
                >
                  <Text className="text-white text-center font-semibold">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};
