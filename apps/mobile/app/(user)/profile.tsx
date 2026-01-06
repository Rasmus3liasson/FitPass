import { AnimatedScreen } from "@shared/components/AnimationProvider";
import { AvatarPicker } from "@shared/components/AvatarPicker";
import HeadingLeft from "@shared/components/HeadingLeft";
import { AdvancedSettings } from "@shared/components/profile/AdvancedSettings";
import { DangerZoneSettings } from "@shared/components/profile/DangerZoneSettings";
import { LocationSettings } from "@shared/components/profile/LocationSettings";
import { MembershipCard } from "@shared/components/profile/MembershipCard";
import { NotificationSettings } from "@shared/components/profile/NotificationSettings";
import { SecurityPrivacySettings } from "@shared/components/profile/SecurityPrivacySettings";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { Section } from "@shared/components/Section";
import SignOutButton from "@shared/components/SignOutButton";
import { LabelSetting } from "@shared/components/ui/LabelSetting";
import { ROUTES } from "@shared/config/constants";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useMembership } from "@shared/hooks/useMembership";
import { useSettings } from "@shared/hooks/useSettings";
import { useSubscription } from "@shared/hooks/useSubscription";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { locationService } from "@shared/services/locationService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pen } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useGlobalFeedback();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Ensure navigation context is ready
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const safeNavigate = (route: string) => {
    if (isNavigationReady && router) {
      try {
        router.push(route as any);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(
    auth.user?.id || ""
  );

  const { membership, loading: isLoadingMembership } = useMembership();
  const { subscription } = useSubscription();

  const {
    settings,
    biometricAvailable,
    updateSetting,
    enableBiometricAuth,
    clearCache,
    exportData,
  } = useSettings();

  // Preferences state
  const [preferences, setPreferences] = useState({
    dark_mode: userProfile?.dark_mode || true,
    pushnotifications: userProfile?.pushnotifications || false,
    emailupdates: userProfile?.emailupdates || false,
    classreminders: userProfile?.classreminders || false,
    marketingnotifications: userProfile?.marketingnotifications || false,
    appupdates: userProfile?.appupdates || false,
    enable_location_services: userProfile?.enable_location_services ?? true,
  });

  const handlePreferenceChange = async (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    if (!auth.user?.id) return;

    setPreferences((prev) => ({ ...prev, [key]: value }));
    await auth.updateUserPreferences(auth.user.id, { [key]: value });

    // If location services setting changed, refresh location service
    if (key === "enable_location_services" && userProfile) {
      try {
        // Get updated user profile and refresh location
        const updatedProfile = {
          ...userProfile,
          enable_location_services: value,
        };
        await locationService.refreshWithProfile(updatedProfile);
      } catch (error) {
        console.error(
          "Failed to refresh location after preference change:",
          error
        );
      }
    }
  };

  const handleSettingChange = async (
    key: keyof typeof settings,
    value: boolean | string
  ) => {
    try {
      if (key === "biometric_auth" && value === true) {
        if (!biometricAvailable) {
          showInfo(
            "Biometrisk autentisering",
            "Biometrisk autentisering är inte tillgänglig på denna enhet."
          );
          return;
        }
        await enableBiometricAuth();
      } else {
        await updateSetting(key, value);
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      showError("Fel", "Kunde inte uppdatera inställningen. Försök igen.");
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Replace with CustomAlert for confirmation dialog
    showInfo(
      "Kontakta support",
      "För att radera ditt konto behöver du kontakta vår support."
    );
    router.push(ROUTES.HELP_CENTER as any);
  };

  const handleExportData = async () => {
    try {
      await exportData();
      showSuccess(
        "Data exporterad",
        "Din data har exporterats framgångsrikt. Kontakta support för att få din datafil."
      );
    } catch (error) {
      showError("Fel", "Kunde inte exportera data. Försök igen senare.");
    }
  };

  const handleClearCache = async () => {
    // TODO: Add confirmation with CustomAlert
    try {
      await clearCache();
      showSuccess("Cache rensad", "Appens cache har rensats framgångsrikt.");
    } catch (error) {
      showError("Fel", "Kunde inte rensa cache. Försök igen.");
    }
  };

  const navigateBasedOnMembership = useCallback(() => {
    if (membership) {
      safeNavigate(ROUTES.PROFILE_MEMBERSHIP_MANAGEMENT);
    } else {
      safeNavigate(ROUTES.PROFILE_MEMBERSHIP_DETAILS);
    }
  }, [membership, safeNavigate]);

  if (isLoadingProfile || isLoadingMembership) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size={"large"} color={colors.primary} />
          <Text className="text-textPrimary">Laddar...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <AnimatedScreen>
        <ScrollView
          className="flex-1 bg-background"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          <HeadingLeft title="" />

          <View className="px-4 mb-8">
            {userProfile?.avatar_url ? (
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={() => safeNavigate(ROUTES.PROFILE_EDIT)}
                  className="relative"
                  activeOpacity={0.8}
                >
                  <AvatarPicker
                    size={96}
                    currentAvatar={userProfile.avatar_url}
                    onAvatarChange={() => {
                      safeNavigate(ROUTES.PROFILE_EDIT);
                    }}
                    disabled={true}
                  />
                  {/* Edit Icon */}
                  <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
                    <Pen size={16} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={() => safeNavigate(ROUTES.PROFILE_EDIT)}
                  className="relative"
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 4,
                      borderColor: "#4F46E5",
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 36,
                        fontWeight: "bold",
                      }}
                    >
                      {`${userProfile?.first_name?.[0] || ""}${
                        userProfile?.last_name?.[0] || ""
                      }`.toUpperCase()}
                    </Text>
                  </View>
                  {/* Edit Icon */}
                  <View
                    className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2"
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Pen size={16} color={colors.textPrimary} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="items-center my-6">
              <Text className="text-textPrimary text-2xl font-bold mb-2">
                {`${userProfile?.first_name} ${userProfile?.last_name}`}
              </Text>
            </View>
          </View>

          <Section title="Ditt Medlemskap">
            <MembershipCard
              membership={membership}
              subscription={subscription}
              onPress={() => navigateBasedOnMembership()}
            />
          </Section>

          <Section title="Inställningar">
            <View className="bg-surface rounded-3xl mx-4 px-6 py-3">
              <LabelSetting
                label="Mörkt läge"
                description="Använd mörkt tema i hela appen"
                value={preferences.dark_mode}
                onValueChange={(value: boolean) =>
                  handlePreferenceChange("dark_mode", value)
                }
                showBorder={true}
              />
              <LabelSetting
                label="Push-notifikationer"
                description="Få meddelanden om bokningar och uppdateringar"
                value={preferences.pushnotifications}
                onValueChange={(value: boolean) =>
                  handlePreferenceChange("pushnotifications", value)
                }
                showBorder={true}
              />
              <LabelSetting
                label="E-postuppdateringar"
                description="Ta emot nyhetsbrev och meddelanden"
                value={preferences.emailupdates}
                onValueChange={(value: boolean) =>
                  handlePreferenceChange("emailupdates", value)
                }
                showBorder={true}
              />
              <LabelSetting
                label="Klasspåminnelser"
                description="Få påminnelser innan dina klasser"
                value={preferences.classreminders}
                onValueChange={(value: boolean) =>
                  handlePreferenceChange("classreminders", value)
                }
              />
            </View>
          </Section>

          <LocationSettings
            enableLocationServices={preferences.enable_location_services}
            defaultLocation={
              userProfile?.default_location || "Stockholm, Sverige"
            }
            onEnableLocationServicesChange={(value) =>
              handlePreferenceChange("enable_location_services", value)
            }
            onDefaultLocationPress={() =>
              router.push(ROUTES.PROFILE_LOCATION_SETTINGS as any)
            }
          />

          {/* <AppearanceSettings
            darkMode={settings.dark_mode}
            onDarkModeChange={(value) =>
              handleSettingChange("dark_mode", value)
            }
          /> */}

          <NotificationSettings
            pushNotifications={settings.pushnotifications}
            emailUpdates={settings.emailupdates}
            classReminders={settings.classreminders}
            marketingNotifications={settings.marketingnotifications}
            appUpdates={settings.appupdates}
            onPushNotificationsChange={(value) =>
              handleSettingChange("pushnotifications", value)
            }
            onEmailUpdatesChange={(value) =>
              handleSettingChange("emailupdates", value)
            }
            onClassRemindersChange={(value) =>
              handleSettingChange("classreminders", value)
            }
            onMarketingNotificationsChange={(value) =>
              handleSettingChange("marketingnotifications", value)
            }
            onAppUpdatesChange={(value) =>
              handleSettingChange("appupdates", value)
            }
          />

          <SecurityPrivacySettings
            biometricAuth={settings.biometric_auth}
            biometricAvailable={biometricAvailable}
            autoBackup={settings.auto_backup}
            crashReporting={settings.crash_reporting}
            analytics={settings.analytics}
            profileVisibility={settings.profile_visibility}
            onBiometricAuthChange={(value) =>
              handleSettingChange("biometric_auth", value)
            }
            onAutoBackupChange={(value) =>
              handleSettingChange("auto_backup", value)
            }
            onCrashReportingChange={(value) =>
              handleSettingChange("crash_reporting", value)
            }
            onAnalyticsChange={(value) =>
              handleSettingChange("analytics", value)
            }
            onProfileVisibilityChange={(value) =>
              handleSettingChange("profile_visibility", value)
            }
            onPrivacySettingsPress={() => safeNavigate(ROUTES.PROFILE_PRIVACY_SETTINGS)}
          />

          <AdvancedSettings
            offlineMode={settings.offline_mode}
            onOfflineModeChange={(value) =>
              handleSettingChange("offline_mode", value)
            }
            onExportData={handleExportData}
            onClearCache={handleClearCache}
          />

          <Section title="Kontoinställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Betalningsmetoder"
                description="Hantera dina kort och betalningsalternativ"
                onPress={() => router.push(ROUTES.PROFILE_BILLING as any)}
              />
            </View>
          </Section>

          <Section title="Support">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Hjälpcenter"
                description="Få svar på vanliga frågor"
                onPress={() => router.push(ROUTES.HELP_CENTER as any)}
                showBorder={true}
              />
              <LabelSetting
                label="Integritetspolicy"
                description="Lär dig hur vi skyddar dina data"
                onPress={() => router.push(ROUTES.PRIVACY_POLICY as any)}
              />
            </View>
          </Section>

          <DangerZoneSettings onDeleteAccount={handleDeleteAccount} />

          <View className="mb-8">
            <SignOutButton />
          </View>
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
