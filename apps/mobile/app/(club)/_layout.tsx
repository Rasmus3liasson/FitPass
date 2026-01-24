import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@shared';
import { GlobalScreenWrapper } from '@shared/components/GlobalScreenWrapper';
import { useClientOnlyValue } from '@shared/components/useClientOnlyValue';
import { useColorScheme } from '@shared/components/useColorScheme';
import { useAuth } from '@shared/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
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

export default function ClubTabLayout() {
  const colorScheme = useColorScheme();
  const { user, userProfile, loading } = useAuth();

  if (loading || (user && !userProfile)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (userProfile?.role !== 'club') return <Redirect href="/(user)" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].background,
          paddingBottom: 25,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: useClientOnlyValue(true, false),

        lazy: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="edit-club/index"
        options={{
          title: 'Redigera Klubb',
          tabBarIcon: ({ color }) => <TabBarIcon name="edit" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Skanna QR',
          tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      {/* Hides the newsletter screen from tabs but keeps it accessible via navigation */}
      <Tabs.Screen
        name="newsletter"
        options={{
          href: null,
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
