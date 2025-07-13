import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAmenities } from "@/src/hooks/useAmenities";
import { useCategories, useClubs } from "@/src/hooks/useClubs";
import { mapClubToFacilityCardProps } from "@/src/utils/mapClubToFacilityProps";
import { isClubOpenNow } from "@/src/utils/openingHours";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Filter, MapPin, Search, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FacilitiesSections from "../discover/facilitiesSections";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  // State for show more/less in New Partners
  const [visibleGymsCount, setVisibleGymsCount] = useState(4);

  // Use useClubs for fetching clubs with filters
  const { data: clubs = [], isLoading: loading } = useClubs({
    search: searchQuery,
    // latitude: 59.3293,
    // longitude: 18.0686,
    // radius: 50,
  });

  // Fetch categories and amenities from the database
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: amenities = [], isLoading: amenitiesLoading } = useAmenities();

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id)
        ? prev.filter((amenityId) => amenityId !== id)
        : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAmenities([]);
  };

  // Filter clubs by selected categories and amenities
  const filteredClubs = clubs.filter((club) => {
    // Category filter: if none selected, pass; else, club.type must be in selectedCategories
    // Find the names of the selected categories
    const selectedCategoryNames = categories
      .filter((cat) => selectedCategories.includes(cat.id))
      .map((cat) => cat.name);

    const categoryMatch =
      selectedCategories.length === 0 ||
      (club.type && selectedCategoryNames.includes(club.type));
    // Amenity filter: if none selected, pass; else, club.amenities must include all selectedAmenities
    // Find the names of the selected amenities
    const selectedAmenityNames = amenities
      .filter((a) => selectedAmenities.includes(a.id))
      .map((a) => a.name);

    const clubAmenities = Array.isArray(club.amenities) ? club.amenities : [];
    const amenityMatch =
      selectedAmenities.length === 0 ||
      selectedAmenityNames.every((name) => clubAmenities.includes(name));
    const result = categoryMatch && amenityMatch;

    return result;
  });

  // Sort clubs so open ones are first in real time
  const sortedClubs = [...filteredClubs].sort((a, b) => {
    const aOpen = isClubOpenNow(a);
    const bOpen = isClubOpenNow(b);
    return aOpen === bOpen ? 0 : aOpen ? -1 : 1;
  });

  // New Partners (Gyms) with show more/less
  const gyms = sortedClubs;
  const visibleGyms = gyms.slice(0, visibleGymsCount);

  // Top Rated and Popular Credits (no show more/less for now)
  const topRated = [...sortedClubs]
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 4);

  const mostPopularClubs = sortedClubs
    .sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0))
    .slice(0, 4);

  if (categoriesLoading || amenitiesLoading) {
    return (
      <SafeAreaWrapper>
        <StatusBar style="light" />
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Search Bar */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center space-x-2">
            <View className="flex-1 flex-row items-center bg-surface rounded-xl px-4 py-2">
              <Search size={20} color="#A0A0A0" />
              <TextInput
                className="flex-1 ml-2 text-white"
                placeholder="Search facilities..."
                placeholderTextColor="#A0A0A0"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={20} color="#A0A0A0" />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              className="bg-surface rounded-xl p-2"
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-surface rounded-xl p-2"
              onPress={() => router.push("/map/")}
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
            selectedCategories={selectedCategories}
            selectedAmenities={selectedAmenities}
            toggleCategory={toggleCategory}
            toggleAmenity={toggleAmenity}
            clearFilters={clearFilters}
          />
        )}

        <ScrollView
          className="flex-1 mt-3"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <>
              <FacilitiesSections
                title="Top Rated"
                description="Highest rated by our members"
                facilities={topRated.map((club) =>
                  mapClubToFacilityCardProps(
                    club,
                    () => router.push(`/facility/${club.id}`),
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
                    () => router.push(`/facility/${club.id}`),
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
                    () => router.push(`/facility/${club.id}`),
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
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
