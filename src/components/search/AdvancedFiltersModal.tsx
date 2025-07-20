import { Star, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../../constants/custom-colors";

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

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilters) => void;
  categories: FilterOption[];
  amenities: FilterOption[];
  initialFilters?: Partial<AdvancedFilters>;
  resultCount?: number;
  onFiltersChange?: (filters: AdvancedFilters) => number;
}

const defaultFilters: AdvancedFilters = {
  categories: [],
  amenities: [],
  distance: 15,
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
  resultCount,
  onFiltersChange,
}) => {
  const [filters, setFilters] = useState<AdvancedFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [liveResultCount, setLiveResultCount] = useState<number | undefined>(
    resultCount
  );

  useEffect(() => {
    if (visible) {
      setFilters({ ...defaultFilters, ...initialFilters });
      setLiveResultCount(resultCount);
    }
  }, [visible, initialFilters, resultCount]);

  // Update live result count when filters change within the modal
  useEffect(() => {
    if (visible && onFiltersChange) {
      const newCount = onFiltersChange(filters);
      setLiveResultCount(newCount);
    }
  }, [filters, visible, onFiltersChange]);

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
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

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.distance !== defaultFilters.distance) count++;
    if (filters.rating !== defaultFilters.rating) count++;
    if (
      filters.priceRange[0] !== defaultFilters.priceRange[0] ||
      filters.priceRange[1] !== defaultFilters.priceRange[1]
    )
      count++;
    if (filters.openNow !== defaultFilters.openNow) count++;
    if (filters.hasClasses !== defaultFilters.hasClasses) count++;
    return count;
  };

  // Use liveResultCount for real-time updates, fallback to resultCount
  const currentCount =
    liveResultCount !== undefined ? liveResultCount : resultCount;

  const buttonLabel =
    currentCount === 0
      ? "No clubs found"
      : currentCount !== undefined
      ? `Show ${currentCount} ${currentCount === 1 ? "Club" : "Clubs"}`
      : hasActiveFilters()
      ? `Show Results (${getActiveFilterCount()} filter${
          getActiveFilterCount() > 1 ? "s" : ""
        })`
      : "Show All Clubs";

  const buttonDisabled = currentCount === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="px-6 pt-4 pb-3 border-b border-gray-800/50">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold">Filters</Text>
              {hasActiveFilters() && (
                <Text className="text-primary text-sm mt-1">
                  {getActiveFilterCount()} filters active
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-3">
              {hasActiveFilters() && (
                <TouchableOpacity
                  onPress={resetFilters}
                  className="bg-gray-800 px-3 py-2 rounded-lg"
                >
                  <Text className="text-gray-300 text-sm">Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} className="p-2">
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-5">
            <Text className="text-white text-lg font-semibold mb-4">
              Quick Filters
            </Text>
            <View className="bg-gray-900/50 rounded-2xl p-4 space-y-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-medium">Open Now</Text>
                  <Text className="text-gray-400 text-sm">
                    Currently accepting visits
                  </Text>
                </View>
                <Switch
                  value={filters.openNow}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, openNow: value }))
                  }
                  trackColor={{ false: "#374151", true: `${colors.primary}40` }}
                  thumbColor={filters.openNow ? colors.primary : "#9CA3AF"}
                />
              </View>

              <View className="h-px bg-gray-800" />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-medium">Has Classes</Text>
                  <Text className="text-gray-400 text-sm">
                    Offers fitness classes
                  </Text>
                </View>
                <Switch
                  value={filters.hasClasses}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, hasClasses: value }))
                  }
                  trackColor={{ false: "#374151", true: `${colors.primary}40` }}
                  thumbColor={filters.hasClasses ? colors.primary : "#9CA3AF"}
                />
              </View>
            </View>
          </View>

          {/* Distance Section with Visual Slider */}
          <View className="px-6 py-5">
            <Text className="text-white text-lg font-semibold mb-4">
              Distance • {filters.distance}km radius
            </Text>
            <View className="bg-gray-900/50 rounded-2xl p-4">
              <View className="flex-row justify-between mb-3">
                {[5, 15, 25, 50].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, distance }))
                    }
                    className={`flex-1 py-3 mx-1 rounded-xl ${
                      filters.distance === distance
                        ? "bg-primary"
                        : "bg-gray-800"
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        filters.distance === distance
                          ? "text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {distance}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Categories with Better Visual Hierarchy */}
          {categories.length > 0 && (
            <View className="px-6 py-5">
              <Text className="text-white text-lg font-semibold mb-4">
                Categories
                {filters.categories.length > 0 && (
                  <Text className="text-primary text-sm font-normal">
                    {" "}
                    • {filters.categories.length} selected
                  </Text>
                )}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleCategory(item.id)}
                    className={`px-4 py-3 rounded-2xl border-2 ${
                      filters.categories.includes(item.id)
                        ? "bg-primary/20 border-primary"
                        : "bg-gray-900/50 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        filters.categories.includes(item.id)
                          ? "text-primary"
                          : "text-gray-300"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Rating with Star Icons */}
          <View className="px-6 py-5">
            <Text className="text-white text-lg font-semibold mb-4">
              Minimum Rating
              {filters.rating > 0 && (
                <Text className="text-primary text-sm font-normal">
                  {" "}
                  • {filters.rating}+ stars
                </Text>
              )}
            </Text>
            <View className="bg-gray-900/50 rounded-2xl p-4">
              <View className="flex-row justify-between">
                {[0, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFilters((prev) => ({ ...prev, rating }))}
                    className={`flex-1 py-4 mx-1 rounded-xl items-center ${
                      filters.rating === rating
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-gray-800"
                    }`}
                  >
                    <View className="flex-row items-center mb-1">
                      <Star
                        size={16}
                        color={
                          filters.rating === rating
                            ? colors.primary
                            : colors.textSecondary
                        }
                        fill={
                          filters.rating === rating
                            ? colors.primary
                            : "transparent"
                        }
                      />
                      <Text
                        className={`text-sm ml-1 font-medium ${
                          filters.rating === rating
                            ? "text-primary"
                            : "text-gray-300"
                        }`}
                      >
                        {rating === 0 ? "Any" : `${rating}+`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Simplified Price Range */}
          <View className="px-6 py-5">
            <Text className="text-white text-lg font-semibold mb-4">
              Credits • {filters.priceRange[0]}-{filters.priceRange[1]} per
              visit
            </Text>
            <View className="bg-gray-900/50 rounded-2xl p-4">
              <View className="flex-row justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-400 text-sm mb-2">Min</Text>
                  <View className="flex-row">
                    {[1, 2, 3].map((price) => (
                      <TouchableOpacity
                        key={`min-${price}`}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            priceRange: [
                              price,
                              Math.max(price, prev.priceRange[1]),
                            ],
                          }))
                        }
                        className={`flex-1 py-2 mx-0.5 rounded-lg ${
                          filters.priceRange[0] === price
                            ? "bg-primary"
                            : "bg-gray-800"
                        }`}
                      >
                        <Text
                          className={`text-center text-sm font-medium ${
                            filters.priceRange[0] === price
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="flex-1 ml-2">
                  <Text className="text-gray-400 text-sm mb-2">Max</Text>
                  <View className="flex-row">
                    {[3, 4, 5].map((price) => (
                      <TouchableOpacity
                        key={`max-${price}`}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            priceRange: [
                              Math.min(price, prev.priceRange[0]),
                              price,
                            ],
                          }))
                        }
                        className={`flex-1 py-2 mx-0.5 rounded-lg ${
                          filters.priceRange[1] === price
                            ? "bg-primary"
                            : "bg-gray-800"
                        }`}
                      >
                        <Text
                          className={`text-center text-sm font-medium ${
                            filters.priceRange[1] === price
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Amenities - Simplified */}
          {amenities.length > 0 && (
            <View className="px-6 py-5 pb-8">
              <Text className="text-white text-lg font-semibold mb-4">
                Amenities
                {filters.amenities.length > 0 && (
                  <Text className="text-primary text-sm font-normal">
                    {" "}
                    • {filters.amenities.length} selected
                  </Text>
                )}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {amenities.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleAmenity(item.id)}
                    className={`px-3 py-2 rounded-xl ${
                      filters.amenities.includes(item.id)
                        ? "bg-primary/20 border border-primary"
                        : "bg-gray-800 border border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        filters.amenities.includes(item.id)
                          ? "text-primary"
                          : "text-gray-300"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Simplified Bottom Actions */}
        <View className="px-6 py-4 bg-gray-900/80 border-t border-gray-800">
          <TouchableOpacity
            onPress={() => {
              if (!buttonDisabled) {
                onApplyFilters(filters);
                onClose();
              }
            }}
            disabled={buttonDisabled}
            className={`rounded-2xl py-4 items-center ${
              buttonDisabled ? "bg-gray-700" : "bg-primary"
            }`}
            style={
              !buttonDisabled
                ? {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }
                : {}
            }
          >
            <Text
              className={`font-bold text-lg ${
                buttonDisabled ? "text-gray-400" : "text-white"
              }`}
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
