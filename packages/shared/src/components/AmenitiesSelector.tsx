import { useAddClubAmenity, useAmenities, useClubAmenities, useRemoveClubAmenity } from "../hooks/useAmenities";
import { useAuth } from "../hooks/useAuth";
import { useClubByUserId } from "../hooks/useClubs";
import { Amenity } from "../types";
import React, { useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AmenitiesSelector() {
  const { user } = useAuth();
  const { data: club } = useClubByUserId(user?.id || "");
  const { data: amenities, isLoading } = useAmenities();
  const { data: clubAmenities, isLoading: loadingClubAmenities } = useClubAmenities(club?.id || "");
  const addAmenity = useAddClubAmenity();
  const removeAmenity = useRemoveClubAmenity();
  const [search, setSearch] = useState("");

  if (isLoading || loadingClubAmenities) {
    return <ActivityIndicator color="#6366F1" />;
  }

  const selectedIds = new Set((clubAmenities as Amenity[] | undefined)?.map((a) => a.id));
  const filtered = (amenities as Amenity[] ?? []).filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (amenity: Amenity) => {
    if (!club) return;
    if (selectedIds.has(amenity.id)) {
      removeAmenity.mutate({ clubId: club.id, amenityId: amenity.id });
    } else {
      addAmenity.mutate({ clubId: club.id, amenityId: amenity.id });
    }
  };

  // Show selected amenities at the top
  const selectedAmenities = (amenities as Amenity[] ?? []).filter((a) => selectedIds.has(a.id));

  return (
    <View className="mb-4">
      <Text className="text-textPrimary font-semibold mb-2">Amenities</Text>
      {/* Selected amenities section */}
      {selectedAmenities.length > 0 && (
        <View className="flex-row flex-wrap mb-2">
          {selectedAmenities.map((amenity) => (
            <View
              key={amenity.id}
              className="flex-row items-center bg-primary rounded-full px-3 py-1 mr-2 mb-2"
              style={{ gap: 4 }}
            >
              {amenity.icon ? (
                <Image source={{ uri: amenity.icon }} style={{ width: 18, height: 18, marginRight: 4 }} />
              ) : (
                <View style={{ width: 18, height: 18, marginRight: 4, backgroundColor: '#fff', borderRadius: 9 }} />
              )}
              <Text className="text-textPrimary text-sm">{amenity.name}</Text>
            </View>
          ))}
        </View>
      )}
      <TextInput
        className="bg-surface text-textPrimary rounded-lg px-4 py-2 mb-2 border border-borderGray"
        placeholder="Search amenities..."
        placeholderTextColor="#A0A0A0"
        value={search}
        onChangeText={setSearch}
      />
      <View className="flex-row flex-wrap">
        {filtered.map((amenity) => (
          <TouchableOpacity
            key={amenity.id}
            className={`flex-row items-center px-3 py-1 rounded-full mr-2 mb-2 ${selectedIds.has(amenity.id) ? "bg-primary" : "bg-surface border border-borderGray"}`}
            onPress={() => toggle(amenity)}
            style={{ gap: 4 }}
          >
            {amenity.icon ? (
              <Image source={{ uri: amenity.icon }} style={{ width: 18, height: 18, marginRight: 4 }} />
            ) : (
              <View style={{ width: 18, height: 18, marginRight: 4, backgroundColor: '#fff', borderRadius: 9 }} />
            )}
            <Text className={`text-sm ${selectedIds.has(amenity.id) ? "text-textPrimary" : "text-textSecondary"}`}>{amenity.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 