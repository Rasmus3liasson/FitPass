import FontAwesome from "@expo/vector-icons/FontAwesome";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../polyfills";
// import { initializeStripe } from "@shared/services/StripeService";
import {
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { ANIMATION_CONFIG } from "@shared/config/animations";
import { initializeAppStorage } from "@shared/utils/appInitialization";

import { AnimationProvider } from "@shared/components/AnimationProvider";
import { SplashScreen } from "@shared/components/SplashScreen";
import "../global.css";

import { ThemeProvider } from "@shared/components/ThemeProvider";

import { colors } from "@shared";
import { AuthProvider, useAuth } from "@shared/hooks/useAuth";
import { useUserBookings } from "@shared/hooks/useBookings";
import { useAllClubs, useClubByUserId, useMostPopularClubs } from "@shared/hooks/useClubs";
import { useFavorites } from "@shared/hooks/useFavorites";
import { GlobalFeedbackProvider } from "@shared/hooks/useGlobalFeedback";
import { useMembership } from "@shared/hooks/useMembership";
import { useNotifications } from "@shared/hooks/useNotifications";
import { useUserProfile } from "@shared/hooks/useUserProfile";

export { ErrorBoundary } from "expo-router";

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (fontError) throw fontError;
    
    // Initialize storage when app starts
    initializeAppStorage();
    
    // Initialize Stripe when app starts
    // Uncomment when Stripe environment variables are configured
    // initializeStripe();
  }, [fontError]);

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GlobalFeedbackProvider>
            <AuthProvider>
              <AnimationProvider config={ANIMATION_CONFIG.global}>
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                  <RootWithAuth />
                </View>
              </AnimationProvider>
            </AuthProvider>
          </GlobalFeedbackProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootWithAuth() {
  const { loading: authLoading, user, userProfile } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Initialize notifications
  useNotifications();

  // Preload essential data for all users
  const { data: profileData, isLoading: profileLoading } = useUserProfile(user?.id || "");
  const { membership, loading: membershipLoading } = useMembership();
  const { data: bookings, isLoading: bookingsLoading } = useUserBookings(user?.id || "");
  const { data: favorites, isLoading: favoritesLoading } = useFavorites(user?.id || "");
  const { data: allClubs, isLoading: allClubsLoading } = useAllClubs();
  const { data: popularClubs, isLoading: popularClubsLoading } = useMostPopularClubs(4);

  // Club data loading - always call hook, conditionally use result
  const isClub = userProfile?.role === "club";
  const clubId = user?.id;
  const { isLoading: clubLoading } = useClubByUserId(clubId || "");

  // Calculate combined loading state
  const isProfileDataLoading = authLoading || (user && !userProfile);
  const isEssentialDataLoading = user 
    ? (membershipLoading || bookingsLoading || favoritesLoading || profileLoading || allClubsLoading || popularClubsLoading)
    : false;
  const isClubDataLoading = Boolean(isClub && clubId && clubLoading);
  
  // All data must be loaded before proceeding
  const isDataLoading = Boolean(
    isProfileDataLoading || 
    isEssentialDataLoading || 
    isClubDataLoading
  );

  // Monitor data loading status
  useEffect(() => {
    if (!isDataLoading && !dataLoaded) {
      // Ensure minimum splash duration of 2.5 seconds
      const minDuration = 2500;
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(300, minDuration - elapsed);
      
      const timer = setTimeout(() => {
        setDataLoaded(true);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [isDataLoading, dataLoaded]);

  const handleSplashComplete = () => {
    // Only allow splash to complete if data is loaded
    if (dataLoaded) {
      setSplashComplete(true);
    } else {
      // If data not loaded yet, wait a bit more
      const timer = setTimeout(() => {
        handleSplashComplete();
      }, 200);
      return () => clearTimeout(timer);
    }
  };

  // Show splash screen until data is loaded and splash animation is complete
  if (!splashComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SplashScreen 
          onAnimationComplete={handleSplashComplete}
          isDataLoading={!dataLoaded}
        />
        {/* Pre-load the main app in background for seamless transition */}
        {dataLoaded && (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            opacity: 0 // Keep invisible until splash completes
          }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationTypeForReplace: 'push',
          contentStyle: { backgroundColor: 'transparent' },
        }} 
      />
    </View>
  );
}
