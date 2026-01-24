import { ClassBookingModal } from "@shared/components/ClassBookingModal";
import { ClassesDiscoveryView } from "@shared/components/discover/ClassesDiscoveryView";
import { FacilitySectionsContainer } from "@shared/components/discover/FacilitySectionsContainer";
import { SearchAndFiltersBar } from "@shared/components/discover/SearchAndFiltersBar";
import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { AdvancedFiltersModal } from "@shared/components/search/AdvancedFiltersModal";
import { ROUTES } from "@shared/config/constants";
import colors from "@shared/constants/custom-colors";
import { useAdvancedFilters } from "@shared/hooks/useAdvancedFilters";
import { useAdvancedSearch } from "@shared/hooks/useAdvancedSearch";
import { useAmenities } from "@shared/hooks/useAmenities";
import { useAuth } from "@shared/hooks/useAuth";
import { useAllClasses } from "@shared/hooks/useClasses";
import { useCategories } from "@shared/hooks/useClubs";
import { useDailyAccessDiscovery } from "@shared/hooks/useDailyAccessDiscovery";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { useLocationService } from "@shared/services/locationService";
import { Class as BackendClass, UIClass } from "@shared/types";
import { getOpenState } from "@shared/utils/openingHours";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const auth = useAuth();
  const params = useLocalSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [visibleGymsCount, setVisibleGymsCount] = useState(12);
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"gyms" | "classes">("gyms");
  const [selectedClass, setSelectedClass] = useState<UIClass | null>(null);

  const isDailyAccessMode = params.dailyAccess === "true";
  const replaceGymId = params.replaceGym as string;

  // Fetch all classes
  const { data: allClasses = [], isLoading: classesLoading } = useAllClasses();

  const { isGymSelectedForDailyAccess, handleAddToDailyAccess } =
    useDailyAccessDiscovery({
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
      if (!userProfile || hasInitializedLocation) return;

      try {
        await initializeLocation(userProfile);
        setHasInitializedLocation(true);
      } catch (error) {
        console.error("Failed to initialize location:", error);
        setHasInitializedLocation(true);
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

  // Map backend classes to UI classes
  const getMinutesBetween = (start: string, end: string): number => {
    if (!start || !end) return 60;
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate.getTime() - startDate.getTime();
      return Math.round(diffMs / (1000 * 60));
    } catch {
      return 60;
    }
  };

  const mapToUIClass = (c: BackendClass): UIClass => {
    return {
      id: c.id,
      name: c.name,
      time: c.start_time,
      startTimeISO: c.start_time,
      duration: String(getMinutesBetween(c.start_time, c.end_time)),
      intensity:
        c.intensity === "Low" ||
        c.intensity === "Medium" ||
        c.intensity === "High"
          ? c.intensity
          : "Medium",
      spots: c.capacity - (c.booked_spots ?? 0),
      clubId: c.club_id,
      description: c.description,
      instructor: c.instructor?.profiles?.display_name || "",
      capacity: c.capacity,
      bookedSpots: c.booked_spots,
    };
  };

  const uiClasses = useMemo(
    () => allClasses.filter((c) => c.club_id).map(mapToUIClass),
    [allClasses],
  );

  // Filter classes by search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery) return uiClasses;
    const query = searchQuery.toLowerCase();
    return uiClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.instructor?.toLowerCase().includes(query),
    );
  }, [uiClasses, searchQuery]);

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

  // Infinite scroll handlers
  const loadMoreGyms = () => {
    if (visibleGymsCount < gyms.length) {
      setVisibleGymsCount((prev) => Math.min(prev + 8, gyms.length));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setVisibleGymsCount(12);
    // Refetch will happen automatically via React Query
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Render footer with loading indicator
  const renderFooter = () => {
    if (visibleGymsCount >= gyms.length || loading) return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // FlatList data structure for sections
  const flatListData = [
    { type: "header" },
    { type: "search" },
    ...(activeTab === "gyms" && showFilters ? [{ type: "filters" }] : []),
    ...(isDailyAccessMode || replaceGymId ? [] : [{ type: "tabs" }]),
    { type: "content" },
  ];

  const renderItem = ({ item }: any) => {
    switch (item.type) {
      case "header":
        return (
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
                  : activeTab === "gyms"
                    ? "Hitta faciliteter nära dig"
                    : "Hitta och boka klasser"
            }
          />
        );
      case "search":
        return (
          <SearchAndFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            hasActiveFilters={hasActiveFilters}
            onShowAdvancedFilters={() =>
              activeTab === "gyms" && setShowAdvancedFilters(true)
            }
          />
        );
      case "tabs":
        return (
          <View className="px-6 py-4">
            <View className="flex-row bg-surface rounded-xl p-1">
              <TouchableOpacity
                onPress={() => setActiveTab("gyms")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  activeTab === "gyms" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === "gyms" ? "text-white" : "text-textSecondary"
                  }`}
                >
                  Gym
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("classes")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  activeTab === "classes" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === "classes"
                      ? "text-white"
                      : "text-textSecondary"
                  }`}
                >
                  Klasser
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "filters":
        return (
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
        );
      case "content":
        if (activeTab === "classes") {
          return (
            <ClassesDiscoveryView
              classes={filteredClasses}
              onClassPress={setSelectedClass}
            />
          );
        }

        return (
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <FlatList
        className="flex-1 bg-background"
        data={flatListData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreGyms}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21}
        initialNumToRender={4}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

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

      {/* Class Booking Modal */}
      {selectedClass && (
        <ClassBookingModal
          visible={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          classId={selectedClass.id}
          clubId={selectedClass.clubId}
          className={selectedClass.name}
          startTime={selectedClass.startTimeISO}
          duration={parseInt(selectedClass.duration || "0")}
          spots={selectedClass.spots}
          intensity={selectedClass.intensity}
          description={selectedClass.description}
          instructor={selectedClass.instructor}
        />
      )}
    </SafeAreaWrapper>
  );
}
