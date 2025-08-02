import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { AddressInput } from "@/src/components/AddressInput";
import { AvatarPicker } from "@/src/components/AvatarPicker";
import { BackButton } from "@/src/components/Button";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";
import { AddressInfo } from "@/src/services/googlePlacesService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function EditProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile, updateProfile, isUpdating } = useUserProfile(auth.user?.id || "");

  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    phoneNumber: userProfile?.phone_number || "",
    address: userProfile?.default_location || "",
    latitude: userProfile?.latitude || null,
    longitude: userProfile?.longitude || null,
    avatarUrl: userProfile?.avatar_url || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAddressSelect = (addressInfo: AddressInfo) => {
    setFormData(prev => ({
      ...prev,
      address: addressInfo.formatted_address,
      latitude: addressInfo.latitude,
      longitude: addressInfo.longitude,
    }));
  };

  const handleAvatarChange = async (newAvatarUrl: string) => {
    setFormData(prev => ({
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
        console.error('Avatar save error:', error);
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

      Toast.show({
        type: "success",
        text1: "✨ Profile Updated",
        text2: "Your changes have been saved successfully!",
        position: "top",
        visibilityTime: 3000,
      });

      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "❌ Update Failed",
        text2: "Couldn't save your changes. Please try again.",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!auth.user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Toast.show({
        type: "warning",
        text1: "🔒 Password Mismatch",
        text2: "The new passwords don't match. Please try again.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Password Updated",
        text2: "Your password has been updated successfully",
        position: "bottom",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Password Update Failed",
        text2: error.message || "Failed to update password. Please try again.",
        position: "bottom",
      });
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="py-4">
          <BackButton />
        </View>

        {/* Change Avatar */}
        <View className="mb-6 items-center">
          <AvatarPicker
            currentAvatar={formData.avatarUrl}
            onAvatarChange={handleAvatarChange}
          />
        </View>

        {/* First Name */}
        <View className="mb-6">
          <Text className="text-white mb-2">First Name</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your first name"
            placeholderTextColor="#999999"
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
          />
        </View>

        {/* Last Name */}
        <View className="mb-6">
          <Text className="text-white mb-2">Last Name</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your last name"
            placeholderTextColor="#999999"
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
          />
        </View>

        {/* Email */}
        <View className="mb-6">
          <Text className="text-white mb-2">Email</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your email"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            value={auth.user?.email || ""}
            editable={false}
          />
        </View>

        {/* Phone Number */}
        <View className="mb-6">
          <Text className="text-white mb-2">Phone Number</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your phone number"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
          />
        </View>

        {/* Address */}
        <AddressInput
          label="Home Address"
          placeholder="Enter your home address"
          currentAddress={formData.address}
          onAddressSelect={handleAddressSelect}
        />

        {/* Change Password */}
        <View className="mb-6">
          <Text className="text-white mb-2">Change Password</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white mb-2"
            placeholder="Current password"
            placeholderTextColor="#999999"
            secureTextEntry
            value={passwordData.currentPassword}
            onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
          />
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white mb-2"
            placeholder="New password"
            placeholderTextColor="#999999"
            secureTextEntry
            value={passwordData.newPassword}
            onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
          />
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Confirm new password"
            placeholderTextColor="#999999"
            secureTextEntry
            value={passwordData.confirmPassword}
            onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
          />
          {passwordData.newPassword && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-3 items-center mt-4"
              onPress={handlePasswordChange}
            >
              <Text className="text-white text-base font-semibold">Update Password</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-lg font-semibold">Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
