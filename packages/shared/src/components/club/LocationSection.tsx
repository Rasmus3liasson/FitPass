import colors from '@shared/constants/custom-colors';
import { MapPin } from 'phosphor-react-native';
import { Text, TextInput, View } from 'react-native';
import { CustomAddressInput } from '../CustomAddressInput';

interface LocationSectionProps {
  address: string;
  city: string;
  area: string;
  latitude: string;
  longitude: string;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  address,
  city,
  area,
  latitude,
  longitude,
  onAddressChange,
  onCityChange,
  onAreaChange,
  onLatitudeChange,
  onLongitudeChange,
}) => {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-textPrimary text-lg font-semibold">Platsinformation</Text>
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <MapPin size={16} color={colors.primary} />
        </View>
      </View>

      {/* Address */}
      <View className="mb-4">
        <CustomAddressInput
          label="Adress"
          placeholder="Ange adress"
          currentAddress={address}
          tailwindClasses="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
          onAddressSelect={(info) => {
            onAddressChange(info.formatted_address);
            if (info.latitude !== undefined && info.latitude !== null) {
              onLatitudeChange(info.latitude.toString());
            }
            if (info.longitude !== undefined && info.longitude !== null) {
              onLongitudeChange(info.longitude.toString());
            }
            if (info.city) {
              onCityChange(info.city);
            }
            if (info.postal_code) {
              onAreaChange(info.postal_code);
            }
          }}
        />
      </View>

      {/* City and Area */}
      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Stad</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="Stad"
            placeholderTextColor={colors.borderGray}
            value={city}
            onChangeText={onCityChange}
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Område</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="Område"
            placeholderTextColor={colors.borderGray}
            value={area}
            onChangeText={onAreaChange}
          />
        </View>
      </View>

      {/* Coordinates */}
      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Latitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="59.3293"
            placeholderTextColor={colors.borderGray}
            value={latitude}
            onChangeText={(text) => onLatitudeChange(text.replace(/[^0-9.\-]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Longitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="18.0686"
            placeholderTextColor={colors.borderGray}
            value={longitude}
            onChangeText={(text) => onLongitudeChange(text.replace(/[^0-9.\-]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
};
