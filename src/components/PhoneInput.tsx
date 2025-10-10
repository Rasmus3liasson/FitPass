import colors from '@/src/constants/custom-colors';
import { ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const POPULAR_COUNTRIES: CountryCode[] = [
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  onCountryChange?: (country: CountryCode) => void;
}

export const PhoneInput = ({
  value,
  onChangeText,
  placeholder = "Phone number",
  error,
  editable = true,
  onCountryChange,
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(POPULAR_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    onCountryChange?.(country);
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on selected country (basic formatting)
    if (selectedCountry.code === 'SE' && cleaned.length > 0) {
      // Swedish format: XXX-XXX XX XX
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      if (cleaned.length <= 8) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    
    if (selectedCountry.code === 'US' && cleaned.length > 0) {
      // US format: (XXX) XXX-XXXX
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    return cleaned;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View>
      <View className={`flex-row bg-accentGray rounded-xl border ${error ? 'border-red-500' : 'border-accentGray'}`}>
        {/* Country selector */}
        <TouchableOpacity
          onPress={() => setShowCountryPicker(true)}
          className="flex-row items-center px-4 py-4 border-r border-accentGray"
          disabled={!editable}
        >
          <Text className="text-textPrimary text-lg mr-2">{selectedCountry.flag}</Text>
          <Text className="text-textPrimary text-lg mr-1">{selectedCountry.dialCode}</Text>
          <ChevronDown size={16} color={colors.borderGray} />
        </TouchableOpacity>

        {/* Phone input */}
        <TextInput
          className="flex-1 px-4 py-4 text-textPrimary text-lg"
          placeholder={placeholder}
          placeholderTextColor={colors.borderGray}
          value={value}
          onChangeText={handleTextChange}
          keyboardType="phone-pad"
          editable={editable}
        />
      </View>

      {/* Country picker modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface rounded-t-3xl max-h-96">
            <View className="p-4 border-b border-accentGray">
              <Text className="text-textPrimary text-lg font-semibold text-center">Select Country</Text>
            </View>
            
            <View className="flex-1">
              {POPULAR_COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  onPress={() => handleCountrySelect(country)}
                  className="flex-row items-center p-4 border-b border-accentGray"
                >
                  <Text className="text-2xl mr-3">{country.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-textPrimary text-lg">{country.name}</Text>
                  </View>
                  <Text className="text-accentGray text-lg">{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              className="p-4 bg-accentGray rounded-t-xl"
            >
              <Text className="text-textPrimary text-center text-lg font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
