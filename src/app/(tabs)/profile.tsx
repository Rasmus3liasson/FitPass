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
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { MembershipCard } from "@/components/MembershipCard";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import HeadingLeft from "@/src/components/HeadingLeft";
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
  const router = useRouter();

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
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            size={72}
            rounded
          />
          <View className="flex-1 ml-7">
            <Text className="text-white text-xl font-bold mb-1">
              Alex Johnson
            </Text>
            <Text className="text-textSecondary text-sm mb-3">
              alex.johnson@example.com
            </Text>
            <TouchableOpacity
              className="border border-primary rounded-lg py-1.5 px-3 self-start"
              onPress={() => router.push("/profile/edit-profile")}
            >
              <Text
                className="text-primary font-medium text-sm"
                onPress={() => router.push("/profile/edit-profile")}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Section title="Your Membership">
          <MembershipCard
            type="Premium"
            startDate="May 10, 2025"
            credits={20}
            creditsUsed={7}
            onPress={() => router.push("/profile/membership-details")}
          />
        </Section>

        <Section title="Account Settings">
          <View className="bg-surface rounded-2xl overflow-hidden mt-4">
            {[
              {
                label: "Payment Methods",
                icon: CreditCard,
                route: "/payment-methods",
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
                  i === 3 ? "border-b-0" : ""
                }`}
                /* onPress={() => router.push(route)} */
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
              { label: "Dark Mode", value: true },
              { label: "Push Notifications", value: true },
              { label: "Email Updates", value: false },
            ].map(({ label, value }, i) => (
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
                /* onPress={() => router.push(route)} */
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
          onPress={() => router.push("/")}
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
