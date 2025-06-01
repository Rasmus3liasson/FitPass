import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAuth } from "../../hooks/useAuth";

type TabType = "login" | "register" | "club";

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData extends LoginFormData {
  firstName: string;
  lastName: string;
}

interface ClubLoginFormData extends LoginFormData {
  orgNumber: string;
}

const Login = () => {
  const router = useRouter();
  const { user, login, register, loginClub, loginWithSocial, loading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("login");
  
  // Form states
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  
  const [clubData, setClubData] = useState<ClubLoginFormData>({
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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome to FitPass</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="club">Club Login</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <View className="space-y-4">
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Email"
                  value={loginData.email}
                  onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Password"
                  value={loginData.password}
                  onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                  secureTextEntry
                />
                <TouchableOpacity
                  className="rounded-lg bg-blue-500 p-3"
                  onPress={handleLogin}
                >
                  <Text className="text-center text-white font-semibold">Login</Text>
                </TouchableOpacity>
              </View>
            </TabsContent>

            <TabsContent value="register">
              <View className="space-y-4">
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="First Name"
                  value={registerData.firstName}
                  onChangeText={(text) => setRegisterData({ ...registerData, firstName: text })}
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Last Name"
                  value={registerData.lastName}
                  onChangeText={(text) => setRegisterData({ ...registerData, lastName: text })}
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Email"
                  value={registerData.email}
                  onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Password"
                  value={registerData.password}
                  onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
                  secureTextEntry
                />
                <TouchableOpacity
                  className="rounded-lg bg-blue-500 p-3"
                  onPress={handleRegister}
                >
                  <Text className="text-center text-white font-semibold">Register</Text>
                </TouchableOpacity>
              </View>
            </TabsContent>

            <TabsContent value="club">
              <View className="space-y-4">
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Email"
                  value={clubData.email}
                  onChangeText={(text) => setClubData({ ...clubData, email: text })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Password"
                  value={clubData.password}
                  onChangeText={(text) => setClubData({ ...clubData, password: text })}
                  secureTextEntry
                />
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="Organization Number"
                  value={clubData.orgNumber}
                  onChangeText={(text) => setClubData({ ...clubData, orgNumber: text })}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="rounded-lg bg-blue-500 p-3"
                  onPress={handleClubLogin}
                >
                  <Text className="text-center text-white font-semibold">Club Login</Text>
                </TouchableOpacity>
              </View>
            </TabsContent>
          </Tabs>

          <View className="mt-6 space-y-4">
            <TouchableOpacity
              className="rounded-lg bg-white border border-gray-300 p-3"
              onPress={() => handleSocialSignIn("google")}
            >
              <Text className="text-center font-semibold">Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg bg-black p-3"
              onPress={() => handleSocialSignIn("apple")}
            >
              <Text className="text-center text-white font-semibold">Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="mt-4 text-center text-red-500">{error}</Text>
          )}
        </CardContent>
      </Card>
    </View>
  );
};

export default Login;
