import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";

import { Filter, MapPin, Search, X } from "lucide-react-native";

import HeadingLeft from "@/src/components/HeadingLeft";
import FacilitiesSections from "../discover/facilitiesSections";
import { FiltersPanel } from "../discover/filterPanel";

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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

  // Example facilities data - you might fetch this from API
  const newPartners = [
    {
      name: "Atlas Strength",
      type: "Gym",
      image: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg",
      rating: 4.7,
      distance: "1.1 mi",
      openNow: true,
      onPress: () => router.push("/facility/atlas"),
      layout: "grid" as const,
    },
    {
      name: "Zen Studio",
      type: "Yoga",
      image:
        "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg",
      rating: 4.9,
      distance: "0.7 mi",
      openNow: true,
      onPress: () => router.push("/facility/zen"),
      layout: "grid" as const,
    },
  ];

  const topRated = [
    {
      name: "PowerFit Gym",
      type: "Gym",
      image:
        "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg",
      rating: 4.8,
      distance: "0.8 mi",
      openNow: true,
      onPress: () => router.push("/facility/powerfit"),
      layout: "list" as const,
    },
    // ...other top rated
  ];

  const popularCredits = [
    {
      name: "CrossFit Central",
      type: "CrossFit",
      image: "https://images.pexels.com/photos/28080/pexels-photo.jpg",
      rating: 4.5,
      distance: "1.5 mi",
      openNow: true,
      credits: 2,
      onPress: () => router.push("/facility/crossfit-central"),
      layout: "list" as const,
    },
    // ...other popular
  ];
  const categories = [
    { id: "gym", name: "Gym" },
    { id: "swimming", name: "Swimming" },
    // ...
  ];

  const amenities = [
    { id: "parking", name: "Parking" },
    { id: "showers", name: "Showers" },
    // ...
  ];

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <HeadingLeft title={"Discover"} subtitle="Find your fitness spot" />
        <View className="flex-row px-4 mb-4 space-x-3">
          <View className="flex-1 flex-row items-center bg-surface rounded-xl px-3 py-2 space-x-2">
            <Search size={20} color="#A0A0A0" />
            <TextInput
              className="flex-1 text-base text-textPrimary p-0"
              placeholder="Search facilities or classes"
              placeholderTextColor="#A0A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={18} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className="bg-primary rounded-xl w-11 h-11 flex items-center justify-center"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter width={20} height={20} color={"#FFFFFF"} />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-primary rounded-xl w-11 h-11 flex items-center justify-center"
            onPress={() => router.push("/map/")}
          >
            <MapPin size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <FiltersPanel
            categories={categories}
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            amenities={amenities}
            selectedAmenities={selectedAmenities}
            toggleAmenity={toggleAmenity}
            clearFilters={clearFilters}
          />
        )}

        <ScrollView
          className="flex-1 mt-3"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
