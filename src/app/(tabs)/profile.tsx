import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  ChevronRight,
  CreditCard,
  CircleHelp as HelpCircle,
  LogOut,
  Settings,
  Shield,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { MembershipCard } from "@/components/MembershipCard";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import HeadingLeft from "@/src/components/HeadingLeft";
import { useAuth } from "@/src/hooks/useAuth";
import { useMembership } from "@/src/hooks/useMembership";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(auth.user?.id || "");
  const { membership, loading: isLoadingMembership } = useMembership();
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    darkMode: true,
    pushNotifications: true,
    emailUpdates: false,
  });

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    if (!auth.user?.id) return;
    
    setPreferences(prev => ({ ...prev, [key]: value }));
    await auth.updateUserPreferences(auth.user.id, { [key]: value });
  };

  if (isLoadingProfile || isLoadingMembership) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Loading...</Text>
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
      >
        <HeadingLeft title={"Profile"} />

        <View className="flex-row items-center px-4 mb-6">
          <Avatar
            source={{ uri: userProfile?.avatar_url || "https://randomuser.me/api/portraits/men/32.jpg" }}
            size={72}
            rounded
          />
          <View className="flex-1 ml-7">
            <Text className="text-white text-xl font-bold mb-1">
              {`${userProfile?.first_name} ${userProfile?.last_name}`}
            </Text>
            <Text className="text-textSecondary text-sm mb-3">
              {auth.user?.email}
            </Text>
            <TouchableOpacity
              className="border border-primary rounded-lg py-1.5 px-3 self-start"
              onPress={() => router.push("/profile/edit-profile")}
            >
              <Text className="text-primary font-medium text-sm">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title="Your Membership">
          {membership ? (
            <MembershipCard
              type={membership.plan_type || "Premium"}
              startDate={new Date(membership.start_date).toLocaleDateString()}
              credits={membership.credits || 0}
              creditsUsed={membership.active_bookings || 0}
              onPress={() => router.push("/profile/membership-details")}
            />
          ) : (
            <View className="bg-surface rounded-2xl p-4 mt-4">
              <Text className="text-white text-center">No active membership</Text>
            </View>
          )}
        </Section>

        <Section title="Account Settings">
          <View className="bg-surface rounded-2xl overflow-hidden mt-4">
            {[
              {
                label: "Payment Methods",
                icon: CreditCard,
                route: "/profile/payment-methods",
              },
              {
                label: "Notification Settings",
                icon: Bell,
                route: "/notifications-settings",
              },
              { label: "App Settings", icon: Settings, route: "/app-settings" },
            ].map(({ label, icon: Icon, route }, i) => (
              <TouchableOpacity
                key={i}
                className={`flex-row justify-between items-center px-4 py-4 border-b border-borderGray ${
                  i === 2 ? "border-b-0" : ""
                }`}
                onPress={() => router.push(route)}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-full bg-primaryLight items-center justify-center mr-3">
                    <Icon size={20} color="#6366F1" />
                  </View>
                  <Text className="text-white text-base">{label}</Text>
                </View>
                <ChevronRight size={20} color="#A0A0A0" />
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Preferences">
          <View className="bg-surface rounded-2xl overflow-hidden mt-4">
            {[
              { 
                label: "Dark Mode", 
                key: "darkMode" as const,
                value: preferences.darkMode 
              },
              { 
                label: "Push Notifications", 
                key: "pushNotifications" as const,
                value: preferences.pushNotifications 
              },
              { 
                label: "Email Updates", 
                key: "emailUpdates" as const,
                value: preferences.emailUpdates 
              },
            ].map(({ label, key, value }, i) => (
              <View
                key={i}
                className={`flex-row justify-between items-center px-4 py-4 border-b border-borderGray ${
                  i === 2 ? "border-b-0" : ""
                }`}
              >
                <Text className="text-white text-base">{label}</Text>
                <Switch
                  trackColor={{
                    false: "#3e3e3e",
                    true: "rgba(99, 102, 241, 0.4)",
                  }}
                  thumbColor="#6366F1"
                  value={value}
                  onValueChange={(newValue) => handlePreferenceChange(key, newValue)}
                />
              </View>
            ))}
          </View>
        </Section>

        <Section title="Support">
          <View className="bg-surface rounded-2xl overflow-hidden mt-4">
            {[
              { label: "Help Center", icon: HelpCircle, route: "/help-center" },
              {
                label: "Privacy Policy",
                icon: Shield,
                route: "/privacy-policy",
              },
            ].map(({ label, icon: Icon, route }, i) => (
              <TouchableOpacity
                key={i}
                className={`flex-row justify-between items-center px-4 py-4 border-b border-borderGray ${
                  i === 1 ? "border-b-0" : ""
                }`}
                onPress={() => router.push(route)}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-full bg-primaryLight items-center justify-center mr-3">
                    <Icon size={20} color="#6366F1" />
                  </View>
                  <Text className="text-white text-base">{label}</Text>
                </View>
                <ChevronRight size={20} color="#A0A0A0" />
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-primary rounded-xl py-4 mx-4 mt-8 mb-4 space-x-2"
          onPress={auth.signOut}
        >
          <LogOut size={20} color="#FFFFFF" />
          <Text className="text-white text-lg font-semibold">Log Out</Text>
        </TouchableOpacity>

        <View className="items-center mb-8">
          <Text className="text-textSecondary text-sm">FitPass v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
