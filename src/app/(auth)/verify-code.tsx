import { ROUTES } from "@/src/config/constants";
import colors from "@/src/constants/custom-colors";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/integrations/supabase/supabaseClient";

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { handleUserVerification } = useAuth();
  const params = useLocalSearchParams<{ email: string }>();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure email is available
  if (!params.email) {
    router.replace(ROUTES.REGISTER);
    return null;
  }

  const email = params.email as string;

  const handleVerification = async () => {
    // DEV ONLY: Bypass for easier testing
    if (__DEV__ && verificationCode === "123123") {
      
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
        await handleUserVerification(user.id, email);
      }
      router.replace(ROUTES.SIGN_IN);
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      });

      if (verifyError) throw verifyError;

      if(data.user) {
        await handleUserVerification(data.user.id, email);
      }

      // If verification is successful, redirect to login
      router.replace(ROUTES.SIGN_IN);
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) throw resendError;

      // Show success message
      alert("Verification code resent successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0F0F23", "#1A1A2E", "#16213E"]}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-white mb-2">
            Verify Email
          </Text>
          <Text className="text-lg text-gray-400 text-center">
            Enter the verification code sent to {email}
          </Text>
        </View>

        <View className="bg-surface rounded-3xl p-8 shadow-2xl">
          <View className="space-y-6">
            <View>
              <Text className="text-white font-semibold mb-2 text-lg">
                Verification Code
              </Text>
              <TextInput
                className="bg-accentGray border border-borderGray rounded-xl px-4 py-4 text-textPrimary text-lg"
                placeholder="Enter verification code"
                placeholderTextColor={colors.borderGray}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isSubmitting}
              />
            </View>

            {error && <Text className="text-accentRed text-center">{error}</Text>}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center shadow-lg ${isSubmitting ? "bg-accentPurple/60" : "bg-accentPurple"}`}
              onPress={handleVerification}
              disabled={isSubmitting}
            >
              <Text className="text-textPrimary font-bold text-lg">
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isSubmitting}
              className="items-center"
            >
              <Text className="text-accentPurple/60 font-medium">
                Didn't receive the code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
