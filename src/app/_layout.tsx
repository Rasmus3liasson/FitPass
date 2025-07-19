import FontAwesome from "@expo/vector-icons/FontAwesome";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";

import "../../global.css";
import { SplashScreen } from "../components/SplashScreen";
import toastConfig from "../config/toastConfig";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useClubByUserId } from "../hooks/useClubs";

export { ErrorBoundary } from "expo-router";

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <RootWithAuth />
          <Toast config={toastConfig} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootWithAuth() {
  const { loading: authLoading, user, userProfile } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);

  // Club data loading
  const isClub = userProfile?.role === "club";
  const clubId = user?.id;
  let clubLoading = false;
  if (isClub && clubId) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    clubLoading = useClubByUserId(clubId).isLoading;
  }

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Wait for auth and userProfile if user is logged in
  const isProfileLoading = authLoading || (user && !userProfile);
  // Wait for club data if user is a club
  const isDataLoading = isProfileLoading || (isClub && clubLoading);

  if (isDataLoading || !minTimePassed) {
    return <SplashScreen />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
