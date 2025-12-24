import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { Section } from "@shared/components/Section";
import ImagePicker from "@shared/components/ImagePicker";
import { PasswordChangeModal } from "@shared/components/PasswordChangeModal";
import SignOutButton from "@shared/components/SignOutButton";
import { AmenitiesSelector as FormAmenitiesSelector } from "@shared/components/club/AmenitiesSelector";
import { BasicInformationSection } from "@shared/components/club/BasicInformationSection";
import { BusinessInformationSection } from "@shared/components/club/BusinessInformationSection";
import { ClubAvatarSection } from "@shared/components/club/ClubAvatarSection";
import { LocationSection } from "@shared/components/club/LocationSection";
import { OperatingHoursSection } from "@shared/components/club/OperatingHoursSection";
import { StripeConnectSection } from "@shared/components/club/StripeConnectSection";

import { useAuth } from "@shared/hooks/useAuth";
import { useClubForm } from "@shared/hooks/useClubForm";
import { useClubOperations } from "@shared/hooks/useClubOperations";
import { useClubByUserId } from "@shared/hooks/useClubs";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Lock, Newspaper } from "lucide-react-native";
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
  const router = useRouter();
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
          <Text className="text-textPrimary mt-4 text-base">
            Loading club information...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <PageHeader
        title={club ? "Redigera Klubbprofil" : "Skapa Din Klubb"}
        subtitle={
          club
            ? "Uppdatera din klubbinformation och inställningar"
            : "Ställ in din klubbprofil för att komma igång"
        }
        rightElement={
          <TouchableOpacity
            onPress={() => router.push("/(club)/newsletter" as any)}
            className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
          >
            <Newspaper size={20} color="#6366F1" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* Club Profile Section */}
        <Section title={""}>
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
          title="Plats & Kontakt"
          description="Hjälp medlemmar att hitta och besöka din klubb"
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
          title="Företagsinformation"
          description="Organisationsdetaljer och prissättning"
        >
          <BusinessInformationSection
            orgNumber={form.org_number}
            credits={form.credits}
            onOrgNumberChange={(value) => handleChange("org_number", value)}
            onCreditsChange={(value) => handleChange("credits", value)}
          />
        </Section>

        {/* Stripe Connect - Only show for existing clubs */}
        {club?.id && (
          <Section
            title="Utbetalningar"
            description={`Anslut till Stripe för att ta emot utbetalningar från ${process.env.EXPO_PUBLIC_APP_NAME}`}
          >
            <StripeConnectSection
              clubId={club.id}
              clubData={{
                name: form.name,
                address: form.address,
                org_number: form.org_number,
              }}
            />
          </Section>
        )}

        {/* Operating Hours */}
        <Section
          title="Öppettider"
          description="Ställ in när din klubb är öppen för medlemmar"
        >
          <OperatingHoursSection
            openHours={form.open_hours}
            formatOpeningHours={formatOpeningHours}
            hasExistingClub={!!club}
          />
        </Section>

        {/* Amenities */}
        <Section
          title="Bekvämligheter & Funktioner"
          description="Låt medlemmar veta vilka faciliteter du erbjuder"
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
          title="Klubbfoton"
          description="Visa upp dina faciliteter med högkvalitativa bilder"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <ImagePicker
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
          title="Kontosäkerhet"
          description="Hantera dina kontoinställningar och säkerhet"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <TouchableOpacity
              className="flex-row items-center p-4 bg-primary/10 border-2 border-primary/30 rounded-xl"
              onPress={() => setShowPasswordModal(true)}
            >
              <View className="flex-1">
                <Text className="text-textPrimary text-base font-semibold">
                  Byt Lösenord
                </Text>
                <Text className="text-textSecondary text-sm">
                  Uppdatera ditt kontolösenord
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Lock size={16} color="#6366F1" />
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
                <Text className="text-textPrimary text-lg font-semibold ml-2">
                  {club ? "Uppdaterar..." : "Skapar..."}
                </Text>
              </View>
            ) : (
              <Text className="text-textPrimary text-lg font-semibold">
                {club ? "Spara Ändringar" : "Skapa Klubb"}
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
