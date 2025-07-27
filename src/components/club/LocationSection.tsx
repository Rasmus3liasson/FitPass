import { MapPin } from "lucide-react-native";
import { Text, TextInput, View } from 'react-native';

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
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <MapPin size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Address Information</Text>
      </View>

      {/* Address */}
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Street Address</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
          placeholder="Enter street address"
          placeholderTextColor="#9CA3AF"
          value={address}
          onChangeText={onAddressChange}
        />
      </View>

      {/* City and Area */}
      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <Text className="text-white mb-2 font-medium">City</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
            placeholder="City"
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={onCityChange}
          />
        </View>
        <View className="flex-1">
          <Text className="text-white mb-2 font-medium">Area/District</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
            placeholder="Area"
            placeholderTextColor="#9CA3AF"
            value={area}
            onChangeText={onAreaChange}
          />
        </View>
      </View>

      {/* Coordinates */}
      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-white mb-2 font-medium">Latitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
            placeholder="59.3293"
            placeholderTextColor="#9CA3AF"
            value={latitude}
            onChangeText={(text) => onLatitudeChange(text.replace(/[^0-9.\-]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <Text className="text-white mb-2 font-medium">Longitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
            placeholder="18.0686"
            placeholderTextColor="#9CA3AF"
            value={longitude}
            onChangeText={(text) => onLongitudeChange(text.replace(/[^0-9.\-]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
};
