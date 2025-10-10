import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { supabase } from "../../lib/integrations/supabase/supabaseClient";

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          Toast.show({
            type: "error",
            text1: "Authentication Failed",
            text2: error.message,
            position: "top",
            visibilityTime: 4000,
          });
          router.replace("/(auth)/login");
          return;
        }

        if (session) {
          Toast.show({
            type: "success",
            text1: "✅ Welcome!",
            text2: "Successfully signed in with Google",
            position: "top",
            visibilityTime: 3000,
          });
          
          // Navigate to the main app
          router.replace("/");
        } else {
          // No session found, redirect to login
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Auth callback processing error:", error);
        Toast.show({
          type: "error",
          text1: "Authentication Error",
          text2: "Something went wrong during authentication",
          position: "top",
          visibilityTime: 4000,
        });
        router.replace("/(auth)/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View className="flex-1 bg-background justify-center items-center p-8">
      <Text className="text-textPrimary text-lg text-center">
        Processing authentication...
      </Text>
      <Text className="text-accentGray text-sm text-center mt-2">
        Please wait while we complete your sign-in
      </Text>
    </View>
  );
}
