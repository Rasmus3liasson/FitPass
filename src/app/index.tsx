import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function IndexRedirect() {
  const { user, userProfile, loading } = useAuth();

  // Wait for both user and userProfile to be loaded
  if (loading || (user && !userProfile)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href={ROUTES.LOGIN} />;
  if (userProfile?.role === "club") return <Redirect href={ROUTES.CLUB_HOME} />;
  return <Redirect href={ROUTES.CLUB_HOME} />;
}
