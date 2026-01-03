import AuthHeader from "@shared/components/AuthHeader";
import AuthIconNavigation from "@shared/components/AuthIconNavigation";
import SocialButton from "@shared/components/SocialButton";
import { ThemedContainer, ThemedSurface } from "@shared/components/ThemedComponents";
import { useTheme } from "@shared/components/ThemeProvider";
import { ROUTES } from "@shared/config/constants";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useLoginForm } from "@shared/hooks/useLoginForm";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View
} from "react-native";
import ClubLoginForm from "./club";
import ForgotPasswordForm from "./forgot-password";
import RegisterForm from "./register";
import SignInForm from "./sign-in";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const { isDark } = useTheme();
  const { user, userProfile } = useAuth();
  const {
    authType,
    loginData,
    registerData,
    clubData,
    forgotPasswordEmail,
    loading,
    error,
    fieldErrors,
    setAuthType,
    setLoginData,
    setRegisterData,
    setClubData,
    setForgotPasswordEmail,
    clearFieldErrors,
    handleLogin,
    handleRegister,
    handleClubLogin,
    handleSocialSignIn,
    handleForgotPassword,
    handleAddressSelect,
    getHeaderContent,
  } = useLoginForm();

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.role === "club") {
        router.replace(ROUTES.CLUB_HOME as any);
      } else {
        router.replace(ROUTES.USER_HOME as any);
      }
    }
  }, [user, userProfile, router]);

  // Clear field errors when auth type changes
  useEffect(() => {
    clearFieldErrors();
  }, [authType, clearFieldErrors]);

  if (loading) {
    return (
      <ThemedContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size={"large"} color={colors.primary} />
      </ThemedContainer>
    );
  }

  const renderForm = () => {
    switch (authType) {
      case "sign-in":
        return (
          <SignInForm
            email={loginData.email}
            setEmail={(text) => setLoginData({ ...loginData, email: text })}
            password={loginData.password}
            setPassword={(text) =>
              setLoginData({ ...loginData, password: text })
            }
            isSubmitting={loading}
            onSubmit={handleLogin}
            fieldErrors={fieldErrors}
          />
        );
      case "register":
        return (
          <RegisterForm
            firstName={registerData.firstName}
            setFirstName={(text) =>
              setRegisterData({ ...registerData, firstName: text })
            }
            lastName={registerData.lastName}
            setLastName={(text) =>
              setRegisterData({ ...registerData, lastName: text })
            }
            email={registerData.email}
            setEmail={(text) =>
              setRegisterData({ ...registerData, email: text })
            }
            password={registerData.password}
            setPassword={(text) =>
              setRegisterData({ ...registerData, password: text })
            }
            confirmPassword={registerData.confirmPassword}
            setConfirmPassword={(text) =>
              setRegisterData({ ...registerData, confirmPassword: text })
            }
            phone={registerData.phone}
            setPhone={(text) =>
              setRegisterData({ ...registerData, phone: text })
            }
            address={registerData.address}
            latitude={registerData.latitude}
            longitude={registerData.longitude}
            onAddressSelect={handleAddressSelect}
            isSubmitting={loading}
            onSubmit={handleRegister}
            fieldErrors={fieldErrors}
          />
        );
      case "club":
        return (
          <ClubLoginForm
            clubEmail={clubData.email}
            setClubEmail={(text) => setClubData({ ...clubData, email: text })}
            clubPassword={clubData.password}
            setClubPassword={(text) =>
              setClubData({ ...clubData, password: text })
            }
            orgNumber={clubData.orgNumber}
            setOrgNumber={(text) =>
              setClubData({ ...clubData, orgNumber: text })
            }
            isSubmitting={loading}
            onSubmit={handleClubLogin}
            fieldErrors={fieldErrors}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            email={forgotPasswordEmail}
            setEmail={setForgotPasswordEmail}
            isSubmitting={loading}
            onSubmit={handleForgotPassword}
            fieldErrors={fieldErrors}
          />
        );
    }
  };

  const headerContent = getHeaderContent();

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ThemedContainer className="flex-1 relative">
        {/* Icon Navigation */}
        <AuthIconNavigation
          currentAuthType={authType}
          onAuthTypeChange={setAuthType}
          disabled={loading}
        />

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 py-4">
            {/* Header */}
            <View className="mb-10">
              <AuthHeader
                title={headerContent.title}
                subtitle={headerContent.subtitle}
                showLogo={authType !== "register"}
              />
            </View>

            <ThemedSurface className="rounded-2xl p-8 shadow-xl mb-8 border">
              {renderForm()}
            </ThemedSurface>

            {/* Social Login - Only show on sign-in */}
            {authType === "sign-in" && (
              <View className="mb-6">
                <View className="flex-row items-center mb-6">
                  <View className={`flex-1 h-px ${isDark ? 'bg-accentGray' : 'bg-lightBorderGray'}`} />
                  <Text className={`mx-4 text-sm font-medium ${isDark ? 'text-textSecondary' : 'text-lightTextSecondary'}`}>
                    Eller fortsätt med
                  </Text>
                  <View className={`flex-1 h-px ${isDark ? 'bg-accentGray' : 'bg-lightBorderGray'}`} />
                </View>

                <View className="space-y-5">
                  <SocialButton
                    provider="google"
                    onPress={() => handleSocialSignIn("google")}
                    disabled={loading}
                  />

                  <SocialButton
                    provider="apple"
                    onPress={() => handleSocialSignIn("apple")}
                    disabled={loading}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedContainer>
    </KeyboardAvoidingView>
  );
};

export default Login;
