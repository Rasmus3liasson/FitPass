import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useLocationService } from "@/src/services/locationService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, MapPin, Navigation } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LocationSettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile, updateProfile } = useUserProfile(auth.user?.id || "");
  const { getCurrentLocation, getAddressFromCoordinates } = useLocationService();
  
  const [defaultLocation, setDefaultLocation] = useState(userProfile?.default_location || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile?.default_location) {
      setDefaultLocation(userProfile.default_location);
    }
  }, [userProfile]);

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Get current location using location service
      const location = await getCurrentLocation();
      
      if (!location) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      const { latitude, longitude } = location;
      
      // Get address from coordinates
      const address = await getAddressFromCoordinates(latitude, longitude);
      const locationString = address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      setDefaultLocation(locationString);
      
      // Update user profile with new location
      if (auth.user?.id) {
        updateProfile({
          default_location: locationString,
          latitude,
          longitude,
          enable_location_services: true,
        });
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!auth.user?.id) return;
    
    try {
      updateProfile({
        default_location: defaultLocation.trim() || "Stockholm, Sweden",
      });
      
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

          {/* Current Location Option */}
          <TouchableOpacity
            onPress={handleGetCurrentLocation}
            disabled={isLoadingLocation}
            className="bg-surface rounded-2xl p-4 mb-4 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Navigation size={20} color="#6366F1" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium">
                Use Current Location
              </Text>
              <Text className="text-textSecondary text-sm">
                Get your current location automatically
              </Text>
            </View>
          </TouchableOpacity>

          {/* Manual Location Input */}
          <View className="bg-surface rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
                <MapPin size={20} color="#6366F1" />
              </View>
              <Text className="text-white text-base font-medium">
                Enter Location Manually
              </Text>
            </View>
            
            <TextInput
              value={defaultLocation}
              onChangeText={setDefaultLocation}
              placeholder="e.g., Stockholm, Sweden"
              placeholderTextColor="#A0A0A0"
              className="bg-background border border-borderGray rounded-lg px-4 py-3 text-white text-base"
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
