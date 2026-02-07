import colors from '@fitpass/shared/constants/custom-colors';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { geocodingService } from '../services/geocodingService';
import { AddressInfo } from '../services/googlePlacesService';

interface CustomAddressInputProps {
  label?: string;
  placeholder?: string;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  currentAddress?: string;
  error?: string;
  tailwindClasses?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  lat?: string;
  lon?: string;
}

export const CustomAddressInput: React.FC<CustomAddressInputProps> = ({
  label,
  placeholder = 'Ange adress',
  onAddressSelect,
  currentAddress,
  error,
  tailwindClasses,
}) => {
  const [query, setQuery] = useState(currentAddress || '');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isApiConfigured = geocodingService.isConfigured();

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
  }, [query, isApiConfigured, hasTyped]);

  // Unified autocomplete search (Google + LocationIQ with fallback)
  const searchAddresses = async (searchQuery: string) => {
    if (!isApiConfigured) return;

    setIsLoading(true);
    try {
      const results = await geocodingService.autocomplete(searchQuery, 'se');
      // Debug info (shows which provider is active)

      const mapped = results.map((item) => ({
        description: item.description,
        place_id: item.place_id,
        lat: item.latitude?.toString(),
        lon: item.longitude?.toString(),
      }));

      setPredictions(mapped);
      if (isFocused) setShowSuggestions(true);
    } catch (err) {
      console.error('Geocoding error:', err);
      setPredictions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // -------- SELECT PREDICTION (NO DETAILS CALL NEEDED) ----------
  const handleSelectPrediction = (prediction: PlacePrediction) => {
    const addressInfo: AddressInfo = {
      formatted_address: prediction.description,
      latitude: parseFloat(prediction.lat || '0'),
      longitude: parseFloat(prediction.lon || '0'),
      street_number: undefined,
      street_name: undefined,
      postal_code: undefined,
      city: undefined,
      country: 'Sweden',
    };

    onAddressSelect(addressInfo);

    setQuery(prediction.description);
    setShowSuggestions(false);
    setHasTyped(false);
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    setHasTyped(true);
    if (text.length < 2) setShowSuggestions(false);
  };

  const handleManualSubmit = () => {
    setIsFocused(false);
    setShowSuggestions(false);

    if (query.trim()) {
      const addressInfo: AddressInfo = {
        formatted_address: query.trim(),
        latitude: 0,
        longitude: 0,
      };
      onAddressSelect(addressInfo);
    }
  };

  return (
    <View className="">
      {label && <Text className="text-textPrimary mb-2">{label}</Text>}

      <View className="relative" style={{ zIndex: 1000 }}>
        <TextInput
          className={
            tailwindClasses
              ? `${tailwindClasses} ${error ? 'border border-accentRed' : 'border'}`
              : `rounded-lg px-4 py-3 text-textPrimary bg-surface ${
                  error ? 'border border-accentRed' : 'border'
                }`
          }
          placeholder={placeholder}
          placeholderTextColor={colors.borderGray}
          value={query}
          onChangeText={handleTextChange}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2 && hasTyped) setShowSuggestions(true);
          }}
          onBlur={handleManualSubmit}
          onSubmitEditing={handleManualSubmit}
          autoCorrect={false}
          autoComplete="street-address"
          returnKeyType="done"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && predictions.length > 0 && (
          <View
            className="absolute left-0 right-0 bg-surface rounded-lg border border-borderGray shadow-lg"
            style={{
              top: '100%',
              marginTop: 4,
              maxHeight: 200,
              zIndex: 2000,
              elevation: 1000,
            }}
          >
            {predictions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                className={`px-4 py-3 ${
                  index < predictions.length - 1 ? 'border-b border-borderGray' : ''
                }`}
                onPress={() => handleSelectPrediction(item)}
              >
                <Text className="text-textPrimary text-sm">{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {error && <Text className="text-accentRed text-sm mt-1">{error}</Text>}
      </View>
    </View>
  );
};
