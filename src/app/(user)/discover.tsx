import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Button } from "@/src/components/Button";
import { AdvancedFiltersModal } from "@/src/components/search/AdvancedFiltersModal";
import { SimpleSearchBar } from "@/src/components/search/SimpleSearchBar";
import { ROUTES } from "@/src/config/constants";
import { useAdvancedSearch } from "@/src/hooks/useAdvancedSearch";
import { useAmenities } from "@/src/hooks/useAmenities";
import { useAuth } from "@/src/hooks/useAuth";
import { useCategories } from "@/src/hooks/useClubs";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLocationService } from "@/src/services/locationService";
import { mapClubToFacilityCardProps } from "@/src/utils/mapClubToFacilityProps";
import { isClubOpenNow } from "@/src/utils/openingHours";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Filter, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FacilitiesSections from "../discover/facilitiesSections";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleGymsCount, setVisibleGymsCount] = useState(4);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    searchResults,
    isLoading: loading,
  } = useAdvancedSearch();

  // Get user profile for location preferences
  const { data: userProfile } = useUserProfile(auth.user?.id || "");

  // Use location service
  const {
    location,
    isLoading: isLoadingLocation,
    initializeLocation,
    calculateDistance,
  } = useLocationService();

  // Initialize location when user profile is available
  useEffect(() => {
    const setupLocation = async () => {
      if (userProfile !== undefined && !hasInitializedLocation) {
        try {
          const userLocation = await initializeLocation(userProfile);
          updateFilters({
            location: userLocation,
          });
          setHasInitializedLocation(true);
        } catch (error) {
          console.error("Failed to initialize location:", error);
          setHasInitializedLocation(true); // Set to true to prevent infinite retries
        }
      }
    };

    setupLocation();
  }, [
    userProfile?.id,
    userProfile?.enable_location_services,
    hasInitializedLocation,
  ]);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: amenities = [], isLoading: amenitiesLoading } = useAmenities();

  const categoryOptions = categories.map((cat) => ({
    id: cat.id || cat.name,
    label: cat.name,
    value: cat.name,
  }));

  const amenityOptions = amenities.map((amenity) => ({
    id: amenity.id || amenity.name,
    label: amenity.name,
    value: amenity.name,
  }));

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Use searchResults instead of clubs
  const clubs = searchResults;
  const filteredClubs = clubs; // Already filtered by the hook

  // Sort clubs so open ones are first in real time
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    const aOpen = isClubOpenNow(a);
    const bOpen = isClubOpenNow(b);
    return aOpen === bOpen ? 0 : aOpen ? -1 : 1;
  });

  const gyms = sortedClubs;
  const visibleGyms = gyms.slice(0, visibleGymsCount);

  const topRated = [...sortedClubs]
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 4);

  const mostPopularClubs = sortedClubs
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
    .slice(0, 4);

  if (categoriesLoading || amenitiesLoading || isLoadingLocation) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Enhanced Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white font-bold text-3xl mb-2">Discover</Text>
          <Text className="text-textSecondary text-lg opacity-80">
            Find the perfect place to work out
          </Text>
        </View>

        {/* Enhanced Search Bar */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1">
              <SimpleSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Search facilities..."
              />
            </View>
            <TouchableOpacity
              className={`rounded-2xl p-3 border shadow-lg ${
                hasActiveFilters 
                  ? "bg-primary/20 border-primary/30" 
                  : "bg-surface/30 border-surface/20 backdrop-blur-sm"
              }`}
              onPress={() => setShowAdvancedFilters(true)}
            >
              <Filter
                size={22}
                color={hasActiveFilters ? "#6366F1" : "#A0A0A0"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface/30 backdrop-blur-sm border border-surface/20 rounded-2xl p-3 shadow-lg"
              onPress={() => router.push(ROUTES.MAP as any)}
            >
              <MapPin size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            categories={categories}
            amenities={amenities}
            selectedCategories={filters.categories}
            selectedAmenities={filters.amenities}
            toggleCategory={(id: string) => {
              const newCategories = filters.categories.includes(id)
                ? filters.categories.filter((catId) => catId !== id)
                : [...filters.categories, id];
              updateFilters({ categories: newCategories });
            }}
            toggleAmenity={(id: string) => {
              const newAmenities = filters.amenities.includes(id)
                ? filters.amenities.filter((amenityId) => amenityId !== id)
                : [...filters.amenities, id];
              updateFilters({ amenities: newAmenities });
            }}
            clearFilters={() =>
              updateFilters({ categories: [], amenities: [] })
            }
          />
        )}

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <View className="bg-surface/50 backdrop-blur-sm rounded-3xl p-8 items-center mx-6">
                <ActivityIndicator size="large" color="#6366F1" />
                <Text className="text-textSecondary mt-4 font-medium">
                  Finding facilities near you...
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Show search results when user has searched or applied filters */}
              {searchQuery.trim() || hasActiveFilters ? (
                sortedClubs.length > 0 ? (
                  <FacilitiesSections
                    title="Search Results"
                    description={`Found ${sortedClubs.length} facilities`}
                    facilities={sortedClubs.map((club) =>
                      mapClubToFacilityCardProps(
                        club,
                        () => router.push(ROUTES.FACILITY(club.id) as any),
                        "grid"
                      )
                    )}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center py-16 mx-6">
                    <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-8 items-center border border-surface/20 shadow-lg">
                      <View className="bg-surface/40 p-4 rounded-2xl mb-4">
                        <Filter size={48} color="#A0A0A0" />
                      </View>
                      <Text className="text-white font-semibold text-lg mb-2 text-center">
                        No facilities found
                        {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ""}
                      </Text>
                      <Text className="text-textSecondary text-center text-base opacity-80 leading-relaxed">
                        Try adjusting your search or filters to find more options
                      </Text>
                    </View>
                  </View>
                )
              ) : (
                <>
                  <FacilitiesSections
                    title="Top Rated"
                    description="Highest rated by our members"
                    facilities={topRated.map((club) =>
                      mapClubToFacilityCardProps(
                        club,
                        () => router.push(ROUTES.FACILITY(club.id) as any),
                        "grid"
                      )
                    )}
                  />

                  <FacilitiesSections
                    title="Most Popular ones"
                    description="Visited the most"
                    facilities={mostPopularClubs.map((club) =>
                      mapClubToFacilityCardProps(
                        club,
                        () => router.push(ROUTES.FACILITY(club.id) as any),
                        "grid"
                      )
                    )}
                  />

                  <FacilitiesSections
                    title="New Partners"
                    description="Recently added to our network"
                    facilities={visibleGyms.map((club) =>
                      mapClubToFacilityCardProps(
                        club,
                        () => router.push(ROUTES.FACILITY(club.id) as any),
                        "grid"
                      )
                    )}
                  />

                  {visibleGymsCount < gyms.length && (
                    <View className="px-6 py-4">
                      <Button
                        title="Show More Facilities"
                        onPress={() => setVisibleGymsCount(visibleGymsCount + 4)}
                        variant="secondary"
                        style="bg-surface/30 backdrop-blur-sm border border-surface/20 shadow-lg"
                      />
                    </View>
                  )}
                  {visibleGymsCount > 4 && (
                    <View className="px-6 py-2">
                      <Button
                        title="Show Less"
                        onPress={() => setVisibleGymsCount(4)}
                        variant="outline"
                        style="border-textSecondary/30 bg-transparent"
                      />
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={updateFilters}
        categories={categoryOptions}
        amenities={amenityOptions}
        initialFilters={filters}
        resultCount={filteredClubs.length}
        onFiltersChange={(tempFilters) => {
          // This function calculates how many clubs would match the temporary filters
          // without actually applying them yet

          const filteredResults = searchResults.filter((club) => {
            // Category filter - using club type for now since categories aren't in Club interface
            if (tempFilters.categories.length > 0) {
              if (!tempFilters.categories.includes(club.type)) return false;
            }

            // Amenity filter - using club amenities array
            if (tempFilters.amenities.length > 0) {
              const clubAmenities = club.amenities || [];
              const hasMatchingAmenity = tempFilters.amenities.some(
                (amenityId) => clubAmenities.includes(amenityId)
              );
              if (!hasMatchingAmenity) return false;
            }

            // Rating filter
            if (tempFilters.rating > 0) {
              const clubRating = club.avg_rating || 0;
              if (clubRating < tempFilters.rating) return false;
            }

            // Distance filter (if location is available)
            if (tempFilters.location && club.latitude && club.longitude) {
              const distance = calculateDistance(
                tempFilters.location.latitude,
                tempFilters.location.longitude,
                club.latitude,
                club.longitude
              );
              if (distance > tempFilters.distance) return false;
            }

            // Open now filter
            if (tempFilters.openNow) {
              if (!isClubOpenNow(club)) return false;
            }

            // Has classes filter - using a simple check for now
            if (tempFilters.hasClasses) {
              // For now, assume all clubs have classes unless specified otherwise
              // You might want to add a proper field to the Club interface
              if (club.type === "restaurant" || club.type === "spa")
                return false;
            }

            return true;
          });

          return filteredResults.length;
        }}
      />
    </SafeAreaWrapper>
  );
}
