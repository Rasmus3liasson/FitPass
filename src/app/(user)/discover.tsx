import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { FacilitySectionsContainer } from "@/src/components/discover/FacilitySectionsContainer";
import { SearchAndFiltersBar } from "@/src/components/discover/SearchAndFiltersBar";
import { PageHeader } from "@/src/components/PageHeader";
import { AdvancedFiltersModal } from "@/src/components/search/AdvancedFiltersModal";
import { ROUTES } from "@/src/config/constants";
import { useAdvancedFilters } from "@/src/hooks/useAdvancedFilters";
import { useAdvancedSearch } from "@/src/hooks/useAdvancedSearch";
import { useAmenities } from "@/src/hooks/useAmenities";
import { useAuth } from "@/src/hooks/useAuth";
import { useCategories } from "@/src/hooks/useClubs";
import { useDailyAccessDiscovery } from "@/src/hooks/useDailyAccessDiscovery";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLocationService } from "@/src/services/locationService";
import { getOpenState } from "@/src/utils/openingHours";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View
} from "react-native";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const auth = useAuth();
  const params = useLocalSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [visibleGymsCount, setVisibleGymsCount] = useState(4);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  // Check if we're in Daily Access selection mode
  const isDailyAccessMode = params.dailyAccess === "true";

  // Check if we're replacing a gym
  const replaceGymId = params.replaceGym as string;

  // Debug logging
  console.log("Discover params:", params);
  console.log("isDailyAccessMode:", isDailyAccessMode);
  console.log("replaceGymId:", replaceGymId);

  // Daily Access logic
  const {
    isGymSelectedForDailyAccess,
    handleAddToDailyAccess,
  } = useDailyAccessDiscovery({
    userId: auth.user?.id,
    isDailyAccessMode,
    replaceGymId,
  });

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

  // Initialize location when user profile is available but don't set it in filters by default
  useEffect(() => {
    const setupLocation = async () => {
      if (userProfile !== undefined && !hasInitializedLocation) {
        try {
          await initializeLocation(userProfile);
          // Don't automatically set location in filters - let user choose when to use it
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

  // Advanced filters logic
  const {
    showAdvancedFilters,
    setShowAdvancedFilters,
    handleApplyFilters,
    calculateFilterResultCount,
  } = useAdvancedFilters({
    searchResults,
    categories,
    amenities,
    updateFilters,
  });

  const categoryOptions = categories.map((cat) => ({
    id: cat.id || cat.name || "unknown",
    label: cat.name || "Unknown Category",
    value: cat.name || "unknown",
  }));

  const amenityOptions = amenities.map((amenity) => ({
    id: amenity.id || amenity.name || "unknown",
    label: amenity.name || "Unknown Amenity",
    value: amenity.name || "unknown",
  }));

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle facility card click - always navigate to facility details
  const handleFacilityClick = (club: any) => {
    router.push(ROUTES.FACILITY(club.id) as any);
  };

  // Use searchResults instead of clubs
  const clubs = searchResults;
  const filteredClubs = clubs; // Already filtered by the hook

  // Sort clubs so open ones are first in real time
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    const aOpen = getOpenState(a.open_hours) === "open";
    const bOpen = getOpenState(b.open_hours) === "open";
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
      <AnimatedScreen>
        <View className="flex-1 bg-background">
          {/* Enhanced Header */}
          <PageHeader
            title={
              replaceGymId
                ? "Ersätt gym"
                : isDailyAccessMode
                ? "Välj gym för Daily Access"
                : "Upptäck"
            }
            subtitle={
              replaceGymId
                ? "Välj ett nytt gym att ersätta det befintliga med"
                : isDailyAccessMode
                ? "Välj upp till 3 gym för din Daily Access-medlemskap"
                : "Hitta faciliteter nära dig"
            }
          />

          {/* Search and Filters */}
          <SearchAndFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            hasActiveFilters={hasActiveFilters}
            onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
          />

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
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            <FacilitySectionsContainer
              loading={loading}
              searchQuery={searchQuery}
              hasActiveFilters={hasActiveFilters}
              sortedClubs={sortedClubs}
              visibleGyms={visibleGyms}
              visibleGymsCount={visibleGymsCount}
              topRated={topRated}
              mostPopularClubs={mostPopularClubs}
              gyms={gyms}
              onFacilityClick={handleFacilityClick}
              isGymSelectedForDailyAccess={isGymSelectedForDailyAccess}
              isDailyAccessMode={isDailyAccessMode}
              onAddToDailyAccess={handleAddToDailyAccess}
              onShowMore={() => setVisibleGymsCount(visibleGymsCount + 4)}
              onShowLess={() => setVisibleGymsCount(4)}
            />
          </ScrollView>
        </View>

        {/* Advanced Filters Modal */}
        <AdvancedFiltersModal
          visible={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onApplyFilters={handleApplyFilters}
          categories={categoryOptions}
          amenities={amenityOptions}
          initialFilters={filters}
          resultCount={filteredClubs.length}
          onFiltersChange={calculateFilterResultCount}
        />
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
