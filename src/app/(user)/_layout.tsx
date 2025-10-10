import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Redirect, Tabs } from "expo-router";
import React from "react";

import { GlobalScreenWrapper } from "@/src/components/GlobalScreenWrapper";
import { useClientOnlyValue } from "@/src/components/useClientOnlyValue";
import colors from "@/src/constants/custom-colors";
import { useAuth } from "@/src/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} className="-mb-[3px]" {...props} />;
}

// Wrapper for tab screens to add animations
function TabScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GlobalScreenWrapper animationType="fade" duration={250}>
      {children}
    </GlobalScreenWrapper>
  );
}

export default function TabLayout() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // User tabs only (no club tabs)
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surface,
          borderTopWidth: 0.5,
          paddingBottom: 25,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: useClientOnlyValue(true, false),
        // Add smooth tab transitions
        lazy: false, // Preload tabs for smoother transitions
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hem",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Upptäck",
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />

      <Tabs.Screen
        name="checkin"
        options={{
          title: "Incheckning",
          tabBarIcon: ({ color }) => <TabBarIcon name="check" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Socialt",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
