import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { getClubs } from "@/lib/integrations/supabase/queries/clubQueries";
import { Club } from "@/types";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Filter, MapPin, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import FacilitiesSections from "../discover/facilitiesSections";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, [searchQuery, selectedCategories, selectedAmenities]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery,
        type: selectedCategories[0], // Using first selected category as type filter
        area: selectedAmenities[0], // Using first selected amenity as area filter
      };
      const data = await getClubs(filters);
      setClubs(data);
    } catch (error) {
      console.error("Error fetching clubs:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Group clubs by type for sections
  const transformClubToFacilityInfo = (club: Club) => ({
    name: club.name,
    type: club.type,
    image: club.image_url || "https://via.placeholder.com/150",
    rating: club.avg_rating || 0,
    distance: "0.8 mi", // This would need to be calculated based on user location
    openNow: true, // This would need to be calculated based on open_hours
    credits: 1, // Default credits
    onPress: () => router.push(`/facility/${club.id}`),
    layout: "grid" as const,
  });

  const newPartners = clubs
    .filter((club) => club.type === "Gym")
    .slice(0, 2)
    .map(transformClubToFacilityInfo);

  const topRated = clubs
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
    .slice(0, 2)
    .map(transformClubToFacilityInfo);

  const popularCredits = clubs
    .filter((club) => club.type === "CrossFit")
    .slice(0, 2)
    .map(transformClubToFacilityInfo);

  const categories = [
    { id: "Gym", name: "Gym" },
    { id: "CrossFit", name: "CrossFit" },
    { id: "Yoga", name: "Yoga" },
    { id: "Swimming", name: "Swimming" },
    { id: "Climbing", name: "Climbing" },
  ];

  const amenities = [
    { id: "Parking", name: "Parking" },
    { id: "Showers", name: "Showers" },
    { id: "Lockers", name: "Lockers" },
    { id: "WiFi", name: "WiFi" },
    { id: "Towel Service", name: "Towel Service" },
  ];

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
                title="New Partners"
                description="Recently added to our network"
                facilities={newPartners}
              />

              <FacilitiesSections
                title="Top Rated"
                description="Highest rated by our members"
                facilities={topRated}
              />

              <FacilitiesSections
                title="Popular with Credits"
                description="Best value for your membership"
                facilities={popularCredits}
              />
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
