import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import EnhancedImagePicker from "@/src/components/ImagePicker";
import { PasswordChangeModal } from "@/src/components/PasswordChangeModal";
import SignOutButton from "@/src/components/SignOutButton";
import { AmenitiesSelector as FormAmenitiesSelector } from "@/src/components/club/AmenitiesSelector";
import { BasicInformationSection } from "@/src/components/club/BasicInformationSection";
import { BusinessInformationSection } from "@/src/components/club/BusinessInformationSection";
import { ClubAvatarSection } from "@/src/components/club/ClubAvatarSection";
import { LocationSection } from "@/src/components/club/LocationSection";
import { OperatingHoursSection } from "@/src/components/club/OperatingHoursSection";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubForm } from "@/src/hooks/useClubForm";
import { useClubOperations } from "@/src/hooks/useClubOperations";
import { useClubByUserId } from "@/src/hooks/useClubs";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Lock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditClubScreen() {
  const { user } = useAuth();
  const { data: club, isLoading } = useClubByUserId(user?.id || "");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Use custom hooks for form management and operations
  const {
    form,
    handleChange,
    updateFormFromClub,
    checkForTempOpeningHours,
    formatOpeningHours,
  } = useClubForm(club);

  const { saveClub, isUpdating } = useClubOperations();

  // Update form when club data is loaded
  useEffect(() => {
    if (club) {
      updateFormFromClub(club);
    }
  }, [club, updateFormFromClub]);

  // Listen for updated opening hours when returning from opening hours screen
  useFocusEffect(
    React.useCallback(() => {
      checkForTempOpeningHours();
    }, [checkForTempOpeningHours])
  );

  const handleSave = async () => {
    const success = await saveClub(form, club);
    // Additional logic after save if needed
  };

  const handleAvatarChange = (newPhotos: string[]) => {
    handleChange("photos", newPhotos);
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-white mt-4 text-base">
            Loading club information...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 py-4"></View>

        {/* Club Profile Section */}
        <Section
          title={club ? "Edit Club Profile" : "Create Your Club"}
          description={
            club
              ? "Update your club information and settings"
              : "Set up your club profile to get started"
          }
        >
          <ClubAvatarSection
            clubName={form.name}
            photos={form.photos}
            onAvatarChange={handleAvatarChange}
            clubId={club?.id}
            autoSave={!!club?.id} // Enable auto-save only for existing clubs (not new ones)
          />

          <BasicInformationSection
            name={form.name}
            type={form.type}
            description={form.description}
            onNameChange={(value) => handleChange("name", value)}
            onTypeChange={(value) => handleChange("type", value)}
            onDescriptionChange={(value) => handleChange("description", value)}
          />
        </Section>

        {/* Location Section */}
        <Section
          title="Location & Contact"
          description="Help members find and visit your club"
        >
          <LocationSection
            address={form.address}
            city={form.city}
            area={form.area}
            latitude={form.latitude}
            longitude={form.longitude}
            onAddressChange={(value) => handleChange("address", value)}
            onCityChange={(value) => handleChange("city", value)}
            onAreaChange={(value) => handleChange("area", value)}
            onLatitudeChange={(value) => handleChange("latitude", value)}
            onLongitudeChange={(value) => handleChange("longitude", value)}
          />
        </Section>

        {/* Business Information */}
        <Section
          title="Business Information"
          description="Organization details and pricing"
        >
          <BusinessInformationSection
            orgNumber={form.org_number}
            credits={form.credits}
            onOrgNumberChange={(value) => handleChange("org_number", value)}
            onCreditsChange={(value) => handleChange("credits", value)}
          />
        </Section>

        {/* Operating Hours */}
        <Section
          title="Operating Hours"
          description="Set when your club is open to members"
        >
          <OperatingHoursSection
            openHours={form.open_hours}
            formatOpeningHours={formatOpeningHours}
            hasExistingClub={!!club}
          />
        </Section>

        {/* Amenities */}
        <Section
          title="Amenities & Features"
          description="Let members know what facilities you offer"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <FormAmenitiesSelector
              selectedAmenities={form.amenities}
              onAmenitiesChange={(amenities) =>
                handleChange("amenities", amenities)
              }
            />
          </View>
        </Section>

        {/* Club Images */}
        <Section
          title="Club Photos"
          description="Showcase your facilities with high-quality images"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <EnhancedImagePicker
              value={form.photos}
              onChange={(val) => handleChange("photos", val)}
              fullWidth
              bucket="images"
              folder="clubs"
              maxImages={10}
            />
          </View>
        </Section>

        {/* Account Security Section */}
        <Section
          title="Account Security"
          description="Manage your account settings and security"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <TouchableOpacity
              className="flex-row items-center p-4 bg-primary/10 border-2 border-primary/30 rounded-xl"
              onPress={() => setShowPasswordModal(true)}
            >
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Lock size={16} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">
                  Change Password
                </Text>
                <Text className="text-textSecondary text-sm">
                  Update your account password
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Save Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center shadow-lg"
            onPress={handleSave}
            disabled={isUpdating}
            style={{
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {isUpdating ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-semibold ml-2">
                  {club ? "Updating..." : "Creating..."}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-semibold">
                {club ? "Save Changes" : "Create Club"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="px-6">
          <SignOutButton />
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <PasswordChangeModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </SafeAreaWrapper>
  );
}
