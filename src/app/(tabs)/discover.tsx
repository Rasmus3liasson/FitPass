import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Filter, MapPin, Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { FacilityCard } from "@/components/FacilityCard";
import { FilterChip } from "@/components/FilterChip";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";

const categories = [
  { id: "gym", name: "Gym" },
  { id: "swimming", name: "Swimming" },
  { id: "climbing", name: "Climbing" },
  { id: "crossfit", name: "CrossFit" },
  { id: "yoga", name: "Yoga" },
  { id: "pilates", name: "Pilates" },
  { id: "boxing", name: "Boxing" },
  { id: "cycling", name: "Cycling" },
];

const amenities = [
  { id: "parking", name: "Parking" },
  { id: "showers", name: "Showers" },
  { id: "lockers", name: "Lockers" },
  { id: "sauna", name: "Sauna" },
  { id: "towels", name: "Towel Service" },
  { id: "wifi", name: "WiFi" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((catId) => catId !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(
        selectedAmenities.filter((amenityId) => amenityId !== id)
      );
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedAmenities([]);
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <View className="px-4 py-4">
          <Text className="text-3xl font-bold text-textPrimary mb-1">
            Discover
          </Text>
          <Text className="text-base text-textSecondary">
            Find the perfect fitness spot
          </Text>
        </View>

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
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-primary rounded-xl w-11 h-11 flex items-center justify-center"
            onPress={() => router.push("/map/")}
          >
            <MapPin size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="bg-surface rounded-2xl mx-4 p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-textPrimary">
                Filters
              </Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text className="text-sm text-primary">Clear All</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-base font-semibold text-textPrimary mb-3">
              Facility Type
            </Text>
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

            <Text className="text-base font-semibold text-textPrimary mb-3">
              Amenities
            </Text>
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
        )}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Section
            title="New Partners"
            description="Recently added to our network"
          >
            <View className="flex-row flex-wrap space-x-3 space-y-3 mt-4">
              <FacilityCard
                name="Atlas Strength"
                type="Gym"
                image="https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg"
                rating={4.7}
                distance="1.1 mi"
                openNow={true}
                onPress={() => router.push("/facility/atlas")}
                layout="grid"
              />
              <FacilityCard
                name="Zen Studio"
                type="Yoga"
                image="https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg"
                rating={4.9}
                distance="0.7 mi"
                openNow={true}
                onPress={() => router.push("/facility/zen")}
                layout="grid"
              />
            </View>
          </Section>

          <Section title="Top Rated" description="Highest rated by our members">
            <FacilityCard
              name="PowerFit Gym"
              type="Gym"
              image="https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg"
              rating={4.8}
              distance="0.8 mi"
              openNow={true}
              onPress={() => router.push("/facility/powerfit")}
              layout="list"
            />
            <FacilityCard
              name="Boulder Zone"
              type="Climbing"
              image="https://images.pexels.com/photos/449609/pexels-photo-449609.jpeg"
              rating={4.9}
              distance="2.3 mi"
              openNow={false}
              onPress={() => router.push("/facility/boulder")}
              layout="list"
            />
            <FacilityCard
              name="AquaLife Center"
              type="Swimming"
              image="https://images.pexels.com/photos/261185/pexels-photo-261185.jpeg"
              rating={4.6}
              distance="1.2 mi"
              openNow={true}
              onPress={() => router.push("/facility/aqualife")}
              layout="list"
            />
          </Section>

          <Section
            title="Popular with Credits"
            description="Best value for your membership"
          >
            <FacilityCard
              name="CrossFit Central"
              type="CrossFit"
              image="https://images.pexels.com/photos/28080/pexels-photo.jpg"
              rating={4.5}
              distance="1.5 mi"
              openNow={true}
              credits={2}
              onPress={() => router.push("/facility/crossfit-central")}
              layout="list"
            />
            <FacilityCard
              name="Cycle House"
              type="Cycling"
              image="https://images.pexels.com/photos/4162579/pexels-photo-4162579.jpeg"
              rating={4.3}
              distance="0.5 mi"
              openNow={true}
              credits={1}
              onPress={() => router.push("/facility/cycle-house")}
              layout="list"
            />
          </Section>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
