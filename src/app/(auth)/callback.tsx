import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { supabase } from "../../lib/integrations/supabase/supabaseClient";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useGlobalFeedback();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          showError("Autentisering misslyckades", error.message);
          router.replace("/(auth)/login");
          return;
        }

        if (session) {
          showSuccess("✅ Välkommen!", "Inloggning med Google lyckades");
          
          // Navigate to the main app
          router.replace("/");
        } else {
          // No session found, redirect to login
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Auth callback processing error:", error);
        showError("Autentiseringsfel", "Något gick fel under autentiseringen");
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
