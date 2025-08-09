import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { ROUTES } from "../config/constants";

export default function IndexRedirect() {
  const { user, userProfile, loading } = useAuth();
  const hasRedirected = useRef(false);

  console.log('IndexRedirect - user:', !!user, 'userProfile:', !!userProfile, 'loading:', loading, 'role:', userProfile?.role);

  // Reset redirect flag when user state changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [user?.id]);

  // Wait for both user and userProfile to be loaded
  if (loading || (user && !userProfile)) {
    console.log('Still loading, showing activity indicator');
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // Prevent multiple redirects
  if (hasRedirected.current) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  hasRedirected.current = true;
  
  if (!user) {
    console.log('No user, redirecting to login');
    return <Redirect href={ROUTES.LOGIN as any} />;
  }
  if (userProfile?.role === "club") {
    console.log('Club user, redirecting to club home');
    return <Redirect href={ROUTES.CLUB_HOME as any} />;
  }
  console.log('Regular user, redirecting to user home');
  return <Redirect href={ROUTES.USER_HOME as any} />;
}
