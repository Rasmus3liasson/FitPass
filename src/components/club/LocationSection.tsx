import { MapPin } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";
import { CustomAddressInput } from "../CustomAddressInput";

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
        <Text className="text-textPrimary text-lg font-semibold">
          Address Information
        </Text>
      </View>

      {/* Address */}
      <View className="mb-4">
        <CustomAddressInput
          label="Street Address"
          placeholder="Enter street address"
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
          <Text className="text-textPrimary mb-2 font-medium">City</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="City"
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={onCityChange}
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Area/District</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
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
          <Text className="text-textPrimary mb-2 font-medium">Latitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="59.3293"
            placeholderTextColor="#9CA3AF"
            value={latitude}
            onChangeText={(text) =>
              onLatitudeChange(text.replace(/[^0-9.\-]/g, ""))
            }
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-2 font-medium">Longitude</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-textPrimary border border-accentGray"
            placeholder="18.0686"
            placeholderTextColor="#9CA3AF"
            value={longitude}
            onChangeText={(text) =>
              onLongitudeChange(text.replace(/[^0-9.\-]/g, ""))
            }
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
};
