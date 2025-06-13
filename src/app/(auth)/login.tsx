import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Activity } from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";
import ClubLoginForm from "./club";
import RegisterForm from "./register";
import SignInForm from "./signIn";

type TabType = "login" | "register" | "club";

const { width } = Dimensions.get("window");

const Login = () => {
  const router = useRouter();
  const { user, login, register, loginClub, loginWithSocial, loading, error } =
    useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("login");

  // Form states
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const [clubData, setClubData] = useState({
    email: "",
    password: "",
    orgNumber: "",
  });

  useEffect(() => {
    if (user) {
      router.replace("/");
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
      await register({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "login":
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
      default:
        return null;
    }
  };

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
          <Text className="text-4xl font-bold text-white mb-2">Welcome</Text>
          <Text className="text-lg text-gray-400 text-center">
            Sign in to access your fitness journey
          </Text>
        </View>

        {/* Tab Navigation */}
        <View className="bg-[#1E1E2E] rounded-2xl p-1 mb-8 shadow-xl">
          <View className="flex-row">
            {[
              { key: "login", label: "Sign In" },
              { key: "register", label: "Sign Up" },
              { key: "club", label: "Club" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                className={`flex-1 py-4 rounded-xl ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                    : ""
                }`}
                onPress={() => setActiveTab(tab.key as TabType)}
                style={{
                  backgroundColor: activeTab === tab.key ? "#6366F1" : "transparent",
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    activeTab === tab.key ? "text-white" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form Content */}
        <View className="bg-[#1E1E2E] rounded-3xl p-8 shadow-2xl">
          {renderTabContent()}
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
            <Text className="text-gray-800 font-semibold text-lg">Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-black rounded-2xl p-4 flex-row items-center justify-center shadow-lg border border-gray-700"
            onPress={() => handleSocialSignIn("apple")}
          >
            <Text className="text-white font-semibold text-lg">Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <Text className="text-red-400 text-center">{error}</Text>
          </View>
        )}

        {/* Skip to Homepage */}
        <TouchableOpacity 
          className="mt-8 items-center"
          onPress={() => router.replace("/(tabs)")}
        >
          <Text className="text-indigo-400 font-medium text-lg">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default Login;