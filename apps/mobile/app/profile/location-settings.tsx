import { AddressInput } from "@shared/components/AddressInput";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { AddressInfo } from "@shared/services/googlePlacesService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function LocationSettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile, updateProfile } = useUserProfile(
    auth.user?.id || ""
  );
  const { showSuccess, showError } = useGlobalFeedback();

  const [defaultLocation, setDefaultLocation] = useState(
    userProfile?.default_location || ""
  );
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
    setDefaultLocation(addressInfo.formatted_address);
    setAddressCoordinates({
      latitude: addressInfo.latitude,
      longitude: addressInfo.longitude,
    });
  };

  const handleSaveLocation = async () => {
    if (!auth.user?.id) return;

    try {
      const updateData: any = {
        default_location: defaultLocation.trim() || "Stockholm, Sweden",
      };

      // Include coordinates if available from address selection
      if (addressCoordinates) {
        updateData.latitude = addressCoordinates.latitude;
        updateData.longitude = addressCoordinates.longitude;
      }

      await updateProfile(updateData);

      showSuccess("Framgång", "Din standardplats har uppdaterats.");
      router.back();
    } catch (error) {
      console.error("❌ Error saving location:", error);
      showError("Fel", "Kunde inte uppdatera din plats. Försök igen.");
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
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-textPrimary text-lg font-semibold">
            Platsinställningar
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          <View className="mb-6">
            <Text className="text-textPrimary text-xl font-bold mb-2">
              Ange din standardplats
            </Text>
            <Text className="text-textSecondary text-base">
              Denna plats kommer att användas för att beräkna avstånd till gym
              när platstjänster är inaktiverade eller otillgängliga.
            </Text>
          </View>

          {/* Address Input */}
          <View className="bg-surface rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-4">
                <MapPin size={20} color={colors.primary} />
              </View>
              <Text className="text-textPrimary text-base font-medium">
                Ange din plats
              </Text>
            </View>

            <AddressInput
              label=""
              placeholder="t.ex. Stockholm, Sverige"
              onAddressSelect={handleAddressSelect}
              currentAddress={defaultLocation}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveLocation}
            className="bg-primary rounded-2xl py-4 items-center"
          >
            <Text className="text-textPrimary text-base font-semibold">
              Spara plats
            </Text>
          </TouchableOpacity>

          {/* Info Section */}
          <View className="bg-surface rounded-2xl p-4 mt-6">
            <Text className="text-textPrimary text-base font-medium mb-2">
              Om platstjänster
            </Text>
            <Text className="text-textSecondary text-sm leading-relaxed">
              FitPass använder din plats för att visa korrekta avstånd till gym
              och träningscentrum. Du kan inaktivera platstjänster i
              huvudprofilinställningarna och använda din standardplats istället.
              Din platsdata används endast för avståndberäkningar och delas
              aldrig med tredje part.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
