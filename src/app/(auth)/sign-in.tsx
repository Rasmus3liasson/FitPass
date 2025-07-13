import { ROUTES } from "@/src/config/constants";
import colors from "@/src/constants/custom-colors";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Activity } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import SignInForm from "./signIn";

const SignInScreen = () => {
  const router = useRouter();
  const { login, loginWithSocial, loading, error } = useAuth();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    try {
      await loginWithSocial(provider);
    } catch (err) {
      console.error("Social sign-in error:", err);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#121212]">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.accentPurple]}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accentPurple items-center justify-center mb-6 shadow-lg">
            <Activity size={40} color={colors.textPrimary} strokeWidth={2.5} />
          </View>
          <Text className="text-4xl font-bold text-textPrimary mb-2">Welcome</Text>
          <Text className="text-lg text-textSecondary text-center">
            Sign in to access your fitness journey
          </Text>
        </View>

        {/* Form Content */}
        <View className="bg-surface rounded-3xl p-8 shadow-2xl">
          <SignInForm
            email={loginData.email}
            setEmail={(text) => setLoginData({ ...loginData, email: text })}
            password={loginData.password}
            setPassword={(text) => setLoginData({ ...loginData, password: text })}
            isSubmitting={loading}
            onSubmit={handleLogin}
          />
        </View>

        {/* Social Login */}
        <View className="mt-8 space-y-4">
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-600" />
            <Text className="mx-4 text-gray-400 text-sm">Or continue with</Text>
            <View className="flex-1 h-px bg-gray-600" />
          </View>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 flex-row items-center justify-center shadow-lg"
            onPress={() => handleSocialSignIn("google")}
          >
            <Text className="text-gray-800 font-semibold text-lg">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-background rounded-2xl p-4 flex-row items-center justify-center shadow-lg border border-gray-700"
            onPress={() => handleSocialSignIn("apple")}
          >
            <Text className="text-white font-semibold text-lg">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Navigation Links */}
        <View className="mt-8 space-y-4">
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push(ROUTES.REGISTER)}
          >
            <Text className="text-indigo-400 font-medium text-lg">
              Don't have an account? Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.push(ROUTES.CLUB_SIGN_IN)}
          >
            <Text className="text-indigo-400 font-medium text-lg">
              Sign in as Club
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => router.replace(ROUTES.TABS)}
          >
            <Text className="text-indigo-400 font-medium text-lg">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default SignInScreen; 