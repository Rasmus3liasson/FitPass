import colors from '@shared/constants/custom-colors';
import { useAmenities } from "../../hooks/useAmenities";
import { Amenity } from "../../types";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

export const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenities,
  onAmenitiesChange,
}) => {
  const { data: amenities, isLoading } = useAmenities();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const limitAmenities = 10;

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color={colors.primary} />
        <Text className="text-textSecondary mt-2">Loading amenities...</Text>
      </View>
    );
  }

  const selectedIds = new Set(selectedAmenities);
  const filtered = ((amenities as Amenity[]) ?? []).filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (amenity: Amenity) => {
    const newSelected = [...selectedAmenities];
    const amenityName = amenity.name;

    if (selectedIds.has(amenityName)) {
      // Remove amenity
      const index = newSelected.indexOf(amenityName);
      if (index > -1) {
        newSelected.splice(index, 1);
      }
    } else {
      // Add amenity
      newSelected.push(amenityName);
    }

    onAmenitiesChange(newSelected);
  };

  // Show selected amenities at the top
  const selectedAmenityObjects = ((amenities as Amenity[]) ?? []).filter((a) =>
    selectedIds.has(a.name)
  );

  return (
    <View>
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-textPrimary text-lg font-semibold">
          Välj Bekvämligheter
        </Text>
        {/* <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <Text className="text-primary text-lg">✨</Text>
        </View> */}
      </View>

      {/* Selected amenities section */}
      {selectedAmenityObjects.length > 0 && (
        <View className="mb-4">
          <Text className="text-textPrimary font-medium mb-2">
            Valda ({selectedAmenityObjects.length})
          </Text>
          <View className="flex-row flex-wrap">
            {selectedAmenityObjects.map((amenity) => (
              <TouchableOpacity
                key={`selected-${amenity.id}`}
                className="flex-row items-center bg-primary rounded-full px-3 py-2 mr-2 mb-2"
                onPress={() => toggle(amenity)}
              >
                {amenity.icon ? (
                  <Image
                    source={{ uri: amenity.icon }}
                    style={{ width: 16, height: 16, marginRight: 6 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      marginRight: 6,
                      backgroundColor: "white",
                      borderRadius: 8,
                    }}
                  />
                )}
                <Text className="text-textPrimary text-sm font-medium">
                  {amenity.name}
                </Text>
                <Text className="text-textPrimary text-sm ml-2">×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search input */}
      <TextInput
        className="bg-background text-textPrimary rounded-xl px-4 py-3 mb-4 border border-accentGray"
        placeholder="Sök bekvämligheter..."
        placeholderTextColor={colors.borderGray}
        value={search}
        onChangeText={setSearch}
      />

      {/* Available amenities */}
      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-textPrimary font-medium">
            Tillgängliga Bekvämligheter
          </Text>
          {!search && filtered.length > limitAmenities && (
            <Text className="text-textSecondary text-xs">
              {showAll
                ? `Visar alla ${filtered.length}`
                : `Visar ${Math.min(limitAmenities, filtered.length)} av ${
                    filtered.length
                  }`}
            </Text>
          )}
        </View>

        <View className="flex-row flex-wrap">
          {(search || showAll ? filtered : filtered.slice(0, 8)).map(
            (amenity) => {
              const isSelected = selectedIds.has(amenity.name);
              return (
                <TouchableOpacity
                  key={amenity.id}
                  className={`flex-row items-center px-3 py-2 rounded-xl mr-2 mb-2 border ${
                    isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-background border-accentGray"
                  }`}
                  onPress={() => toggle(amenity)}
                >
                  {amenity.icon ? (
                    <Image
                      source={{ uri: amenity.icon }}
                      style={{ width: 16, height: 16, marginRight: 6 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 6,
                        backgroundColor: isSelected ? colors.primary : colors.borderGray,
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? "text-primary font-medium"
                        : "text-textSecondary"
                    }`}
                  >
                    {amenity.name}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* Show more/less button */}
        {!search && filtered.length > 8 && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-3 mt-2 border border-dashed border-accentGray rounded-xl"
            onPress={() => setShowAll(!showAll)}
          >
            <Text className="text-primary font-medium text-sm mr-2">
              {showAll
                ? "Visa färre bekvämligheter"
                : `Visa ${
                    filtered.length - limitAmenities
                  } fler bekvämligheter`}
            </Text>
            <Text className="text-primary text-sm">{showAll ? "↑" : "↓"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 && search && (
        <View className="py-8 items-center">
          <Text className="text-textSecondary">
            Inga bekvämligheter hittades för "{search}"
          </Text>
        </View>
      )}
    </View>
  );
};
