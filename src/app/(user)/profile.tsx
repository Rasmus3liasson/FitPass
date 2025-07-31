import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ChevronRight,
  CreditCard,
  CircleHelp as HelpCircle,
  Settings,
  Shield,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import HeadingLeft from "@/src/components/HeadingLeft";
import SignOutButton from "@/src/components/SignOutButton";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useMembership } from "@/src/hooks/useMembership";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { locationService } from "@/src/services/locationService";
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
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

  if (isLoadingProfile || isLoadingMembership) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <HeadingLeft title="" />

        <View className="px-4 mb-8">
          {userProfile?.avatar_url ? (
            <View className="items-center mb-4">
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
            </View>
          ) : (
            <View className="items-center mb-4">
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
                  style={{ color: "white", fontSize: 36, fontWeight: "bold" }}
                >
                  {`${userProfile?.first_name?.[0] || ""}${
                    userProfile?.last_name?.[0] || ""
                  }`.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          <View className="items-center">
            <Text className="text-white text-2xl font-bold mb-2">
              {`${userProfile?.first_name} ${userProfile?.last_name}`}
            </Text>
            <Text className="text-textSecondary text-base mb-4">
              {auth.user?.email}
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-full py-3 px-8 shadow-lg"
              onPress={() => router.push("/profile/edit-profile")}
              style={{
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text className="text-white font-semibold text-base">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title="Your Membership">
          {membership ? (
            <TouchableOpacity
              className="bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-6 mt-4 mx-4"
              onPress={() =>
                router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)
              }
              activeOpacity={0.8}
              style={{
                shadowColor: "#6366F1",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 12,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-sm font-medium opacity-90">
                    CURRENT PLAN
                  </Text>
                  <Text className="text-white text-2xl font-bold">
                    {membership.plan_type || "Premium"}
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full p-3">
                  <CreditCard size={24} color="#ffffff" />
                </View>
              </View>

              <View className="bg-white/10 rounded-2xl p-4">
                <Text className="text-white/80 text-sm font-medium mb-1">
                  Available Credits
                </Text>
                <Text className="text-white text-3xl font-bold">
                  {membership.credits - (membership.credits_used || 0)}
                </Text>
                <Text className="text-white/70 text-sm">credits remaining</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-surface border-2 border-dashed border-primary rounded-3xl p-6 mt-4 mx-4"
              onPress={() =>
                router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)
              }
              activeOpacity={0.8}
            >
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
                  <CreditCard size={32} color="#6366F1" />
                </View>
                <Text className="text-white text-lg font-bold mb-2">
                  No Active Membership
                </Text>
                <Text className="text-textSecondary text-center mb-4">
                  Get unlimited access to premium gyms and fitness centers
                </Text>
                <View className="bg-primary rounded-full py-3 px-6">
                  <Text className="text-white font-semibold">
                    Choose a Plan
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Section>

        <Section title="Account Settings">
          <View className="mx-4 mt-4 space-y-2">
            {[
              {
                label: "Payment Methods",
                icon: CreditCard,
                route: "/profile/payments/",
                description: "Manage your cards and payment options",
              },
              {
                label: "App Settings",
                icon: Settings,
                route: "/app-settings",
                description: "Customize your app experience",
              },
            ].map(({ label, icon: Icon, route, description }, i) => (
              <TouchableOpacity
                key={i}
                className="bg-surface rounded-2xl p-4 mb-3"
                onPress={() => router.push(route as any)}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                    <Icon size={24} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold mb-1">
                      {label}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {description}
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                    <ChevronRight size={18} color="#A0A0A0" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Preferences">
          <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
            {[
              {
                label: "Dark Mode",
                key: "dark_mode" as const,
                value: preferences.dark_mode,
                description: "Use dark theme throughout the app",
              },
              {
                label: "Push Notifications",
                key: "pushnotifications" as const,
                value: preferences.pushnotifications,
                description: "Get notified about bookings and updates",
              },
              {
                label: "Email Updates",
                key: "emailupdates" as const,
                value: preferences.emailupdates,
                description: "Receive newsletters and announcements",
              },
              {
                label: "Class Reminders",
                key: "classreminders" as const,
                value: preferences.classreminders,
                description: "Get reminded before your classes",
              },
              /*   {
                label: "Marketing Notifications",
                key: "marketingnotifications" as const,
                value: preferences.marketingnotifications,
                description: "Promotional offers and deals",
              },
              {
                label: "App Updates",
                key: "appupdates" as const,
                value: preferences.appupdates,
                description: "New features and app improvements",
              }, */
            ].map(({ label, key, value, description }, i) => (
              <View
                key={i}
                className={`flex-row justify-between items-center py-4 ${
                  i !== 5 ? "border-b border-gray-700/30" : ""
                }`}
              >
                <View className="flex-1 mr-4">
                  <Text className="text-white text-base font-medium mb-1">
                    {label}
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    {description}
                  </Text>
                </View>
                <Switch
                  trackColor={{
                    false: "#374151",
                    true: "rgba(99, 102, 241, 0.4)",
                  }}
                  thumbColor={value ? "#6366F1" : "#9CA3AF"}
                  value={value}
                  onValueChange={(newValue) =>
                    handlePreferenceChange(key, newValue)
                  }
                  style={{
                    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                  }}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Location Settings">
          <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
            <View className="flex-row justify-between items-center pb-4 border-b border-gray-700/30">
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-medium mb-1">
                  Enable Location Services
                </Text>
                <Text className="text-textSecondary text-sm">
                  Allow FitPass to use your location for accurate distance
                  calculations to gyms
                </Text>
              </View>
              <Switch
                trackColor={{
                  false: "#374151",
                  true: "rgba(99, 102, 241, 0.4)",
                }}
                thumbColor={
                  preferences.enable_location_services ? "#6366F1" : "#9CA3AF"
                }
                value={preferences.enable_location_services}
                onValueChange={(value) =>
                  handlePreferenceChange("enable_location_services", value)
                }
                style={{
                  transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                }}
              />
            </View>

            <TouchableOpacity
              className="flex-row justify-between items-center pt-4"
              onPress={() => router.push("/profile/location-settings" as any)}
            >
              <View className="flex-1">
                <Text className="text-white text-base font-medium mb-1">
                  Default Location
                </Text>
                <Text className="text-textSecondary text-sm">
                  {userProfile?.default_location || "Stockholm, Sweden"}
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                <ChevronRight size={18} color="#A0A0A0" />
              </View>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Support">
          <View className="mx-4 mt-4 space-y-2">
            {[
              {
                label: "Help Center",
                icon: HelpCircle,
                route: "/help-center",
                description: "Get answers to common questions",
              },
              {
                label: "Privacy Policy",
                icon: Shield,
                route: "/privacy-policy",
                description: "Learn how we protect your data",
              },
            ].map(({ label, icon: Icon, route, description }, i) => (
              <TouchableOpacity
                key={i}
                className="bg-surface rounded-2xl p-4 mb-3"
                onPress={() => router.push(route as any)}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                    <Icon size={24} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold mb-1">
                      {label}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {description}
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                    <ChevronRight size={18} color="#A0A0A0" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <SignOutButton />

        <View className="items-center mb-8">
          <Text className="text-textSecondary text-sm">FitPass v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
