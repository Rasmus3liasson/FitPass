import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Activity } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import ClubLoginForm from "./club";
import RegisterForm from "./register";
import SignInForm from "./signIn";

type AuthType = "sign-in" | "register" | "club";

const Login = () => {
  const router = useRouter();
  const { user, login, register, loginClub, loginWithSocial, loading, error } = useAuth();
  const [authType, setAuthType] = useState<AuthType>("sign-in");

  // Form states
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
  });

  const [clubData, setClubData] = useState({
    email: "",
    password: "",
    orgNumber: "",
  });

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)");
    }
  }, [user, router]);

  const handleLogin = async () => {
    try {
      await login(loginData.email, loginData.password);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleRegister = async () => {
    try {
      if (registerData.password !== registerData.confirmPassword) {
        // You might want to show an error message here
        return;
      }
      await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phone: registerData.phone,
        location: registerData.city,
      });
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const handleClubLogin = async () => {
    try {
      await loginClub(clubData.email, clubData.password, clubData.orgNumber);
    } catch (err) {
      console.error("Club login error:", err);
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

  const getHeaderContent = () => {
    switch (authType) {
      case "sign-in":
        return {
          title: "Welcome",
          subtitle: "Sign in to access your fitness journey",
        };
      case "register":
        return {
          title: "Create Account",
          subtitle: "Join FitPass and start your fitness journey",
        };
      case "club":
        return {
          title: "Club Login",
          subtitle: "Access your club dashboard",
        };
    }
  };

  const renderForm = () => {
    switch (authType) {
      case "sign-in":
        return (
          <SignInForm
            email={loginData.email}
            setEmail={(text) => setLoginData({ ...loginData, email: text })}
            password={loginData.password}
            setPassword={(text) => setLoginData({ ...loginData, password: text })}
            isSubmitting={loading}
            onSubmit={handleLogin}
          />
        );
      case "register":
        return (
          <RegisterForm
            firstName={registerData.firstName}
            setFirstName={(text) => setRegisterData({ ...registerData, firstName: text })}
            lastName={registerData.lastName}
            setLastName={(text) => setRegisterData({ ...registerData, lastName: text })}
            email={registerData.email}
            setEmail={(text) => setRegisterData({ ...registerData, email: text })}
            password={registerData.password}
            setPassword={(text) => setRegisterData({ ...registerData, password: text })}
            confirmPassword={registerData.confirmPassword}
            setConfirmPassword={(text) => setRegisterData({ ...registerData, confirmPassword: text })}
            phone={registerData.phone}
            setPhone={(text) => setRegisterData({ ...registerData, phone: text })}
            city={registerData.city}
            setCity={(text) => setRegisterData({ ...registerData, city: text })}
            isSubmitting={loading}
            onSubmit={handleRegister}
          />
        );
      case "club":
        return (
          <ClubLoginForm
            clubEmail={clubData.email}
            setClubEmail={(text) => setClubData({ ...clubData, email: text })}
            clubPassword={clubData.password}
            setClubPassword={(text) => setClubData({ ...clubData, password: text })}
            orgNumber={clubData.orgNumber}
            setOrgNumber={(text) => setClubData({ ...clubData, orgNumber: text })}
            isSubmitting={loading}
            formError={error}
            onSubmit={handleClubLogin}
          />
        );
    }
  };

  const renderNavigationLinks = () => {
    switch (authType) {
      case "sign-in":
        return (
          <>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("register")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("club")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Sign in as Club
              </Text>
            </TouchableOpacity>
          </>
        );
      case "register":
        return (
          <>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("sign-in")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("club")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Sign in as Club
              </Text>
            </TouchableOpacity>
          </>
        );
      case "club":
        return (
          <>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("sign-in")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Sign in as User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => setAuthType("register")}
            >
              <Text className="text-indigo-400 font-medium text-lg">
                Create User Account
              </Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  const headerContent = getHeaderContent();

  return (
    <LinearGradient
      colors={["#0F0F23", "#1A1A2E", "#16213E"]}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 items-center justify-center mb-6 shadow-lg">
            <Activity size={40} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text className="text-4xl font-bold text-white mb-2">{headerContent.title}</Text>
          <Text className="text-lg text-gray-400 text-center">
            {headerContent.subtitle}
          </Text>
        </View>

        {/* Form Content */}
        <View className="bg-[#1E1E2E] rounded-3xl p-8 shadow-2xl">
          {renderForm()}
        </View>

        {/* Social Login - Only show on sign-in */}
        {authType === "sign-in" && (
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
        )}

        {error && (
          <View className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Navigation Links */}
        <View className="mt-8 space-y-4">
          {renderNavigationLinks()}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.replace("/(tabs)")}
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

export default Login;
