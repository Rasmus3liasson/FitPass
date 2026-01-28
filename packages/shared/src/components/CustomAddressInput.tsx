import colors from '@fitpass/shared/constants/custom-colors';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  //TODO enable in real production later once we have billing set up
  /* const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY; */
  const apiKey = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY;
  const isApiConfigured = !!apiKey;

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

  // -------- LOCATIONIQ AUTOCOMPLETE ----------
  const searchAddresses = async (searchQuery: string) => {
    if (!isApiConfigured) return;

    setIsLoading(true);
    try {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(
        searchQuery
      )}&limit=5&dedupe=1&normalizecity=1&countrycodes=se`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          description: item.display_name,
          place_id: item.place_id,
          lat: item.lat,
          lon: item.lon,
        }));

        setPredictions(mapped);
        if (isFocused) setShowSuggestions(true);
      } else {
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('❌ LocationIQ error:', err);
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
              ? `${tailwindClasses} ${error ? 'border border-red-500' : 'border'}`
              : `rounded-lg px-4 py-3 text-textPrimary bg-surface ${
                  error ? 'border border-red-500' : 'border'
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
                onPress={() => {
                  console.log('📍 Selected address:', item.description);
                  handleSelectPrediction(item);
                }}
              >
                <Text className="text-textPrimary text-sm">{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {error && <Text className="text-red-400 text-sm mt-1">{error}</Text>}
      </View>
    </View>
  );
};
