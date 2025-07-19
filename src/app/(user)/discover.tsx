import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
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
    Button,
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
  const { location, isLoading: isLoadingLocation, initializeLocation } = useLocationService();

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
          console.error('Failed to initialize location:', error);
          setHasInitializedLocation(true); // Set to true to prevent infinite retries
        }
      }
    };

    setupLocation();
  }, [userProfile?.id, userProfile?.enable_location_services, hasInitializedLocation]);

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
      <SafeAreaWrapper edges={['top']}>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']}>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Enhanced Search Bar */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center space-x-2">
            <View className="flex-1">
              <SimpleSearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Search facilities..."
              />
            </View>
            <TouchableOpacity
              className={`rounded-xl p-2 ${
                hasActiveFilters ? "bg-primary" : "bg-surface"
              }`}
              onPress={() => setShowAdvancedFilters(true)}
            >
              <Filter
                size={20}
                color={hasActiveFilters ? "#FFFFFF" : "#A0A0A0"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface rounded-xl p-2"
              onPress={() => router.push(ROUTES.MAP as any)}
            >
              <MapPin size={20} color="#A0A0A0" />
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
          className="flex-1 mt-3"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#6366F1" />
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
                  <View className="flex-1 items-center justify-center py-12">
                    <Text className="text-lg text-text-secondary text-center">
                      No facilities found
                      {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ""}
                    </Text>
                    <Text className="text-sm text-text-secondary text-center mt-2">
                      Try adjusting your search or filters
                    </Text>
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
                    <Button
                      title="Show More"
                      onPress={() => setVisibleGymsCount(visibleGymsCount + 4)}
                    />
                  )}
                  {visibleGymsCount > 4 && (
                    <Button
                      title="Show Less"
                      onPress={() => setVisibleGymsCount(4)}
                    />
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
      />
    </SafeAreaWrapper>
  );
}
