import { AvatarPicker } from "@shared/components/AvatarPicker";
import { CustomAddressInput } from "@shared/components/CustomAddressInput";
import { PasswordChangeModal } from "@shared/components/PasswordChangeModal";
import { PhoneInput } from "@shared/components/PhoneInput";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { AddressInfo } from "@shared/services/googlePlacesService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Lock } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const {
    data: userProfile,
    updateProfile,
    isUpdating,
  } = useUserProfile(auth.user?.id || "");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();

  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    phoneNumber: userProfile?.phone_number || "",
    address: userProfile?.default_location || "",
    latitude: userProfile?.latitude || null,
    longitude: userProfile?.longitude || null,
    avatarUrl: userProfile?.avatar_url || "",
  });

  const handleAddressSelect = (addressInfo: AddressInfo) => {
    setFormData((prev) => ({
      ...prev,
      address: addressInfo.formatted_address,
      latitude: addressInfo.latitude,
      longitude: addressInfo.longitude,
    }));
  };

  const handleAvatarChange = async (newAvatarUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: newAvatarUrl,
    }));

    // Auto-save the avatar to database immediately
    if (auth.user?.id && newAvatarUrl) {
      try {
        await updateProfile({
          avatar_url: newAvatarUrl,
        });
      } catch (error) {
        console.error("Avatar save error:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!auth.user?.id) return;

    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        default_location: formData.address,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        avatar_url: formData.avatarUrl || undefined,
      });

      showSuccess(
        "Profil uppdaterad",
        "Dina ändringar har sparats framgångsrikt!"
      );

      router.back();
    } catch (error) {
      showError(
        "❌ Uppdatering misslyckades",
        "Kunde inte spara dina ändringar. Försök igen."
      );
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size={"large"} color={colors.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  console.log("UserProfile:", userProfile.avatar_url);

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />

      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Change Avatar */}
        <View className="my-9 items-center">
          <AvatarPicker
            currentAvatar={formData.avatarUrl}
            onAvatarChange={handleAvatarChange}
          />
        </View>

        {/* First Name */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2">Förnamn</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-textPrimary"
            placeholder="Ditt förnamn"
            placeholderTextColor={colors.textSecondary}
            value={formData.firstName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, firstName: text }))
            }
          />
        </View>

        {/* Last Name */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2">Efternamn</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-textPrimary"
            placeholder="Ditt efternamn"
            placeholderTextColor={colors.textSecondary}
            value={formData.lastName}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, lastName: text }))
            }
          />
        </View>

        {/* Email */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2">E-post</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-textPrimary"
            placeholder="Din e-post"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            value={auth.user?.email || ""}
            editable={false}
          />
        </View>

        {/* Phone Number */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2">Telefonnummer</Text>
          <PhoneInput
            value={formData.phoneNumber}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, phoneNumber: text }))
            }
            placeholder="Telefonnummer"
            editable={true}
          />
        </View>

        {/* Address */}
        <View className="mb-6">
          <CustomAddressInput
            label="Hemadress"
            placeholder="Ange din hemadress"
            currentAddress={formData.address}
            onAddressSelect={handleAddressSelect}
          />
        </View>

        {/* Change Password */}
        <View className="mb-6">
          <Text className="text-textPrimary text-lg font-semibold mb-4">
            Kontosäkerhet
          </Text>
          <View className="bg-surface rounded-2xl p-4">
            <TouchableOpacity
              className="flex-row items-center p-4 bg-primary/10 border-2 border-primary/30 rounded-xl"
              onPress={() => setShowPasswordModal(true)}
            >
              <View className="flex-1">
                <Text className="text-textPrimary text-base font-semibold">
                  Byt Lösenord
                </Text>
                <Text className="text-textSecondary text-sm">
                  Uppdatera ditt kontolösenord för säkerhet
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Lock size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text className="text-textPrimary text-lg font-semibold">
              Spara ändringar
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <PasswordChangeModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </SafeAreaWrapper>
  );
}
