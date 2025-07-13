import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Redirect, Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/src/components/useClientOnlyValue";
import { useColorScheme } from "@/src/components/useColorScheme";
import Colors from "@/src/constants/Colors";
import { useAuth } from "@/src/hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} className="-mb-[3px]" {...props} />;
}

export default function ClubTabLayout() {
  const colorScheme = useColorScheme();
  const { user, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login/" />;

  if (userProfile?.role !== "club") return <Redirect href="/(user)/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: Colors[colorScheme ?? "light"].background,
        },
        headerShown: useClientOnlyValue(true, false),
      }}
    >
      <Tabs.Screen
        name="edit-club/index"
        options={{
          title: "Edit Club",
          tabBarIcon: ({ color }) => <TabBarIcon name="edit" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan QR",
          tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
        }}
      />
      {/* Hides the screen from showing to the tabs */}
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
        }}
      />
        <Tabs.Screen
        name="edit-club/open-hours"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
