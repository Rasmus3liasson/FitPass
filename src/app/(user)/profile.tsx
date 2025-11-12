import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import HeadingLeft from "@/src/components/HeadingLeft";
import SignOutButton from "@/src/components/SignOutButton";
import { MembershipCard } from "@/src/components/profile/MembershipCard";
import { LabelSetting } from "@/src/components/ui/LabelSetting";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useMembership } from "@/src/hooks/useMembership";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { locationService } from "@/src/services/locationService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  CreditCard,
  Edit3,
  CircleHelp as HelpCircle,
  Pen,
  Settings,
  Shield,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
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
                  <Avatar
                    source={{ uri: userProfile.avatar_url }}
                    size={96}
                    rounded
                    containerStyle={{
                      borderWidth: 4,
                      borderColor: "#6366F1",
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
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
                      backgroundColor: "#6366F1",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 4,
                      borderColor: "#4F46E5",
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
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
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Edit3 size={16} color="#ffffff" />
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

          <Section title="Platsinställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Aktivera platstjänster"
                description={`Tillåt ${process.env.APP_NAME} att använda din plats för exakta avståndsberäkningar till gym`}
                value={preferences.enable_location_services}
                onValueChange={(value: boolean) =>
                  handlePreferenceChange("enable_location_services", value)
                }
                showBorder={true}
              />
              <LabelSetting
                label="Standardplats"
                description={
                  userProfile?.default_location || "Stockholm, Sverige"
                }
                onPress={() => router.push("/profile/location-settings" as any)}
              />
            </View>
          </Section>

          <Section title="Kontoinställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Betalningsmetoder"
                description="Hantera dina kort och betalningsalternativ"
                icon={CreditCard}
                onPress={() => router.push("/profile/payments/" as any)}
                showBorder={true}
              />
              <LabelSetting
                label="Appinställningar"
                description="Anpassa din appupplevelse"
                icon={Settings}
                onPress={() => router.push("/app-settings" as any)}
              />
            </View>
          </Section>

          <Section title="Support">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Hjälpcenter"
                description="Få svar på vanliga frågor"
                icon={HelpCircle}
                onPress={() => router.push("/help-center" as any)}
                showBorder={true}
              />
              <LabelSetting
                label="Integritetspolicy"
                description="Lär dig hur vi skyddar dina data"
                icon={Shield}
                onPress={() => router.push("/privacy-policy" as any)}
              />
            </View>
          </Section>

          <View className="mb-8">
            <SignOutButton />
          </View>
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
