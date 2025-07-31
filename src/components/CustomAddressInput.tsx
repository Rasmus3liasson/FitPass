import { AddressInfo } from "@/src/services/googlePlacesService";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface CustomAddressInputProps {
  label?: string;
  placeholder?: string;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  currentAddress?: string;
  error?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
}

export const CustomAddressInput: React.FC<CustomAddressInputProps> = ({
  label = "Address",
  placeholder = "Enter your address",
  onAddressSelect,
  currentAddress,
  error,
}) => {
  const [query, setQuery] = useState(currentAddress || "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isApiConfigured = !!apiKey && apiKey !== "";

  // Debounced search
  useEffect(() => {
    if (!isApiConfigured || query.length < 2 || !hasTyped) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      await searchAddresses(query);
    }, 300);

    return () => clearTimeout(searchTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isApiConfigured, hasTyped]);

  const searchAddresses = async (searchQuery: string) => {
    if (!isApiConfigured) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          searchQuery
        )}&types=address&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.predictions) {
        setPredictions(data.predictions);
        if (isFocused) setShowSuggestions(true);
      } else {
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error searching addresses:", error);
      setPredictions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    if (!isApiConfigured) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.result) {
        const result = data.result;
        const addressInfo: AddressInfo = {
          formatted_address: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        };

        // Extract address components
        if (result.address_components) {
          result.address_components.forEach((component: any) => {
            if (component.types.includes("street_number")) {
              addressInfo.street_number = component.long_name;
            } else if (component.types.includes("route")) {
              addressInfo.street_name = component.long_name;
            } else if (
              component.types.includes("locality") ||
              component.types.includes("administrative_area_level_2")
            ) {
              addressInfo.city = component.long_name;
            } else if (component.types.includes("postal_code")) {
              addressInfo.postal_code = component.long_name;
            } else if (component.types.includes("country")) {
              addressInfo.country = component.long_name;
            }
          });
        }

        onAddressSelect(addressInfo);
        setQuery(result.formatted_address);
        setShowSuggestions(false);
        setHasTyped(false);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    getPlaceDetails(prediction.place_id);
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    setHasTyped(true);
    if (text.length < 2) {
      setShowSuggestions(false);
    }
  };

  const handleManualSubmit = () => {
    setIsFocused(false);
    if (query.trim() && !isApiConfigured) {
      const addressInfo: AddressInfo = {
        formatted_address: query.trim(),
        latitude: 0,
        longitude: 0,
      };
      onAddressSelect(addressInfo);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-white mb-2">{label}</Text>

      {!isApiConfigured && (
        <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-3">
          <Text className="text-yellow-400 text-sm">
            📍 Using basic address input. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            for autocomplete functionality.
          </Text>
        </View>
      )}

      <View className="relative">
        <TextInput
          className={`rounded-lg px-4 py-3 text-white bg-surface ${
            error ? "border border-red-500" : "border"
          }`}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2 && hasTyped) {
              setShowSuggestions(true);
            }
          }}
          onBlur={handleManualSubmit}
          autoCorrect={false}
          autoComplete="street-address"
        />

        {isLoading && (
          <View className="absolute right-3 top-3">
            <Text className="text-gray-400 text-sm">🔍</Text>
          </View>
        )}

        {showSuggestions && predictions.length > 0 && (
          <View className="absolute left-0 right-0 top-full mt-1 bg-gray-700 rounded-lg border border-gray-600 max-h-48 z-50">
            {predictions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                className={`px-4 py-3 ${
                  index < predictions.length - 1 ? "border-b border-gray-600" : ""
                }`}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text className="text-white text-sm">{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {error && <Text className="text-red-400 text-sm mt-1">{error}</Text>}
      </View>
    </View>
  );
};
