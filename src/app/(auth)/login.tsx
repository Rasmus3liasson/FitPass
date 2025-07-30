import { ROUTES } from "@/src/config/constants";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import AuthHeader from "../../components/AuthHeader";
import AuthIconNavigation from "../../components/AuthIconNavigation";
import SocialButton from "../../components/SocialButton";
import { useAuth } from "../../hooks/useAuth";
import { useLoginForm } from "../../hooks/useLoginForm";
import ClubLoginForm from "./club";
import ForgotPasswordForm from "./forgot-password";
import RegisterForm from "./register";
import SignInForm from "./sign-in";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
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
      <View className="flex-1 items-center justify-center bg-[#121212]">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
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
            onForgotPassword={() => {
              setForgotPasswordEmail(loginData.email); // Pre-fill with login email
              setAuthType("forgot-password");
            }}
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
    <View className="flex-1 bg-background relative">
      {/* Icon Navigation */}
      <AuthIconNavigation
        currentAuthType={authType}
        onAuthTypeChange={setAuthType}
        disabled={loading}
      />
      
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="mb-10">
          <AuthHeader 
            title={headerContent.title} 
            subtitle={headerContent.subtitle}
            showLogo={authType !== "register"}
          />
        </View>

        
        <View className="bg-surface rounded-2xl p-8 shadow-xl mb-8 border border-gray-800/50">
          {renderForm()}
        </View>

        {/* Social Login - Only show on sign-in */}
        {authType === "sign-in" && (
          <View className="mb-6">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-600" />
              <Text className="mx-4 text-gray-400 text-sm font-medium">
                Or continue with
              </Text>
              <View className="flex-1 h-px bg-gray-600" />
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
    </View>
  );
};


export default Login;
