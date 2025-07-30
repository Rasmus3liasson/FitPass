import { AddressInput } from "@/components/AddressInput";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { AddressInfo } from "@/src/services/googlePlacesService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function LocationSettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile, updateProfile } = useUserProfile(auth.user?.id || "");
  
  const [defaultLocation, setDefaultLocation] = useState(userProfile?.default_location || "");
  const [addressCoordinates, setAddressCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    userProfile?.latitude && userProfile?.longitude
      ? { latitude: userProfile.latitude, longitude: userProfile.longitude }
      : null
  );

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile?.default_location) {
      setDefaultLocation(userProfile.default_location);
    }
    if (userProfile?.latitude && userProfile?.longitude) {
      setAddressCoordinates({
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
      });
    }
  }, [userProfile]);

  const handleAddressSelect = (addressInfo: AddressInfo) => {
    console.log('🏠 Address selected:', addressInfo);
    setDefaultLocation(addressInfo.formatted_address);
    setAddressCoordinates({
      latitude: addressInfo.latitude,
      longitude: addressInfo.longitude,
    });
  };

  const handleSaveLocation = async () => {
    if (!auth.user?.id) return;
    
    try {
      console.log('🔍 Saving location:', defaultLocation);
      console.log('🔍 User ID:', auth.user.id);
      
      const updateData: any = {
        default_location: defaultLocation.trim() || "Stockholm, Sweden",
      };

      // Include coordinates if available from address selection
      if (addressCoordinates) {
        updateData.latitude = addressCoordinates.latitude;
        updateData.longitude = addressCoordinates.longitude;
      }

      await updateProfile(updateData);
      
      console.log('✅ Location saved successfully');
      
      Alert.alert(
        'Success',
        'Your default location has been updated.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error saving location:', error);
      Alert.alert(
        'Error',
        'Failed to update your location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-borderGray">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Location Settings</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <View className="mb-6">
            <Text className="text-white text-xl font-bold mb-2">
              Set Your Default Location
            </Text>
            <Text className="text-textSecondary text-base">
              This location will be used to calculate distances to gyms when location services are disabled or unavailable.
            </Text>
          </View>

          {/* Address Input */}
          <View className="bg-surface rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
                <MapPin size={20} color="#6366F1" />
              </View>
              <Text className="text-white text-base font-medium">
                Enter Your Location
              </Text>
            </View>
            
            <AddressInput
              label=""
              placeholder="e.g., Stockholm, Sweden"
              onAddressSelect={handleAddressSelect}
              currentAddress={defaultLocation}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveLocation}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="text-white text-base font-semibold">
              Save Location
            </Text>
          </TouchableOpacity>

          {/* Info Section */}
          <View className="bg-surface rounded-2xl p-4 mt-6">
            <Text className="text-white text-base font-medium mb-2">
              About Location Services
            </Text>
            <Text className="text-textSecondary text-sm leading-relaxed">
              FitPass uses your location to show accurate distances to gyms and fitness centers. 
              You can disable location services in the main profile settings and use your default 
              location instead. Your location data is only used for distance calculations and is 
              never shared with third parties.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
