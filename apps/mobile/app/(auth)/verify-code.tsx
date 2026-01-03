import AuthHeader from "@shared/components/AuthHeader";
import { ROUTES } from "@shared/config/constants";
import { useAuth } from "@shared/hooks/useAuth";
import {
  resendOtp,
  verifyOtp,
} from "@shared/lib/integrations/supabase/supabaseAuth";
import { supabase } from "@shared/lib/integrations/supabase/supabaseClient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { handleUserVerification } = useAuth();
  const params = useLocalSearchParams<{ email: string; type?: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP input state - array of 6 digits
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Ensure email is available
  if (!params.email) {
    router.replace(ROUTES.REGISTER as any);
    return null;
  }

  const email = params.email as string;
  const verificationType = params.type || "signup";

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const getVerificationCode = () => otp.join("");

  const handleVerification = async () => {
    const verificationCode = getVerificationCode();

    if (verificationCode.length !== 6) {
      setError("Vänligen ange alla 6 siffror");
      return;
    }

    // DEV ONLY: Bypass for easier testing
    if (__DEV__ && verificationCode === "123123") {
      setIsSubmitting(true);
      setError(null);

      try {
        // Try to get current session first
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await handleUserVerification(session.user.id, email);
        } else {
          // Try to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();

          if (refreshData.session?.user) {
            await handleUserVerification(refreshData.session.user.id, email);
          }
        }
      } catch (err: any) {
        console.error("Dev bypass error:", err);
        setError(err.message || "Verifiering misslyckades (dev bypass)");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Verify the confirmation code - this will create the profile
      await verifyOtp(email, verificationCode);

      // The auth state change listener in useAuth will handle navigation
    } catch (err: any) {
      setError(err.message || "Misslyckades att verifiera kod");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Use the new resendOtp function
      await resendOtp(email);

      // Clear current OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      // Show success message (you could use a toast here too)
      setError(null);
    } catch (err: any) {
      setError(err.message || "Misslyckades att skicka om kod");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-background relative">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 py-4">
            {/* Header */}
            <View className="mb-10">
              <AuthHeader
                title="Verifiera E-post"
                subtitle={`Ange den 6-siffriga koden som skickats till ${email}`}
                showLogo={true}
              />
            </View>

            <View className="bg-surface rounded-2xl p-8 shadow-xl mb-8 border border-accentGray/50">
              <View className="space-y-6">
                {/* OTP Input Boxes */}
                <View>
                  <Text className="text-textPrimary font-semibold mb-4 text-lg text-center">
                    Verifieringskod
                  </Text>

                  <View className="flex-row justify-between mb-4">
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          inputRefs.current[index] = ref;
                        }}
                        className={`w-12 h-14 bg-accentGray rounded-xl text-textPrimary text-xl text-center font-bold border-2 ${
                          digit ? "border-primary" : "border-textSecondary/50"
                        }`}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) =>
                          handleKeyPress(nativeEvent.key, index)
                        }
                        keyboardType="number-pad"
                        maxLength={1}
                        editable={!isSubmitting}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                </View>

                {error && (
                  <Text className="text-accentRed text-center text-sm">
                    {"Din kod är felaktig. Vänligen försök igen."}
                  </Text>
                )}

                <TouchableOpacity
                  className={`rounded-xl py-4 items-center shadow-lg ${
                    isSubmitting
                      ? "bg-accentPurple opacity-80"
                      : "bg-accentPurple"
                  }`}
                  onPress={handleVerification}
                  disabled={isSubmitting}
                >
                  <Text className="text-textPrimary font-bold text-lg">
                    {isSubmitting ? "Verifierar..." : "Verifiera E-post"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={isSubmitting}
                  className="items-center py-2"
                >
                  <Text className="text-textSecondary font-medium">
                    Fick du inte koden?{" "}
                    <Text className="text-accentPurple">Skicka om</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
