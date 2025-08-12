import FontAwesome from "@expo/vector-icons/FontAwesome";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";
import "../polyfills";
// import { initializeStripe } from "../services/StripeService";
import { initializeAppStorage } from "../utils/appInitialization";

import "../../global.css";
import { AnimationProvider } from "../components/AnimationProvider";
import { SplashScreen } from "../components/SplashScreen";
import { ThemeProvider } from "../components/ThemeProvider";
import { ANIMATION_CONFIG } from "../config/animations";
import toastConfig from "../config/toastConfig";
import colors from "../constants/custom-colors";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useClubByUserId } from "../hooks/useClubs";
import { useNotifications } from "../hooks/useNotifications";

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
          <AuthProvider>
            <AnimationProvider config={ANIMATION_CONFIG.global}>
              <View style={{ flex: 1, backgroundColor: colors.background }}>
                <RootWithAuth />
              </View>
            </AnimationProvider>
            <Toast config={toastConfig} />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootWithAuth() {
  const { loading: authLoading, user, userProfile } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize notifications
  useNotifications();

  // Club data loading - always call hook, conditionally use result
  const isClub = userProfile?.role === "club";
  const clubId = user?.id;
  const { isLoading: clubLoading } = useClubByUserId(clubId || "");

  // Wait for auth and userProfile if user is logged in
  const isProfileLoading = authLoading || (user && !userProfile);
  // Wait for club data if user is a club
  const isDataLoading = isProfileLoading || (isClub && clubId && clubLoading);

  const handleSplashComplete = () => {
    // Fade out splash screen smoothly
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSplashComplete(true);
    });
  };

  // Show splash screen until data is loaded and splash animation is complete
  if (isDataLoading || !splashComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <SplashScreen onAnimationComplete={handleSplashComplete} />
        </Animated.View>
        {/* Pre-render the main app behind splash to prevent white flash */}
        {splashComplete && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        )}
      </View>
    );
  }
  
  return (
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
  );
}
