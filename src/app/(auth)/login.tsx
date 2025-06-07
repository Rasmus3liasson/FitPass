import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useAuth } from "../../hooks/useAuth";
import ClubLoginForm from "./club";
import RegisterForm from "./register";
import SignInForm from "./signIn";

type TabType = "login" | "register" | "club";

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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Welcome to FitPass</CardTitle>
          <CardDescription className="text-center">
            Sign in to access your accoun
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="login">
                <Text className="text-red-400">Login</Text>
              </TabsTrigger>
              <TabsTrigger value="register">
                <Text>Register</Text>
              </TabsTrigger>
              <TabsTrigger value="club">
                <Text>Club Login</Text>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <SignInForm
                email={loginData.email}
                setEmail={(text) => setLoginData({ ...loginData, email: text })}
                password={loginData.password}
                setPassword={(text) => setLoginData({ ...loginData, password: text })}
                isSubmitting={loading}
                onSubmit={handleLogin}
              />
            </TabsContent>

            <TabsContent value="register">
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
            </TabsContent>

            <TabsContent value="club">
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
            </TabsContent>
          </Tabs>

          <View className="mt-6 space-y-4">
            <TouchableOpacity
              className="rounded-lg bg-white border border-gray-300 p-3"
              onPress={() => handleSocialSignIn("google")}
            >
              <Text className="text-center font-semibold">
                Continue with Google
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-lg bg-black p-3"
              onPress={() => handleSocialSignIn("apple")}
            >
              <Text className="text-center text-white font-semibold">
                Continue with Apple
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="mt-4 text-center text-red-500">{error}</Text>
          )}
        </CardContent>
      </Card>
      <View className="mt-4">
        <TouchableOpacity onPress={() => router.replace("./(tabs)")}>
          <Text className="text-center text-blue-500">go to homepage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;
