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
            text1: "Autentisering misslyckades",
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
            text1: "✅ Välkommen!",
            text2: "Inloggning med Google lyckades",
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
          text1: "Autentiseringsfel",
          text2: "Något gick fel under autentiseringen",
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
        Bearbetar autentisering...
      </Text>
      <Text className="text-textSecondary text-sm text-center mt-2">
        Vänligen vänta medan vi slutför din inloggning
      </Text>
    </View>
  );
}
