import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import HeadingLeft from "@/src/components/HeadingLeft";
import SignOutButton from "@/src/components/SignOutButton";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useMembership } from "@/src/hooks/useMembership";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { locationService } from "@/src/services/locationService";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Activity,
  Calendar,
  ChevronRight,
  CreditCard,
  Edit3,
  CircleHelp as HelpCircle,
  Pen,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Zap
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "react-native-elements";

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Ensure navigation context is ready
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const safeNavigate = (route: string) => {
    if (isNavigationReady && router) {
      try {
        router.push(route as any);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(
    auth.user?.id || ""
  );

  const { membership, loading: isLoadingMembership } = useMembership();

  // Preferences state
  const [preferences, setPreferences] = useState({
    dark_mode: userProfile?.dark_mode || true,
    pushnotifications: userProfile?.pushnotifications || false,
    emailupdates: userProfile?.emailupdates || false,
    classreminders: userProfile?.classreminders || false,
    marketingnotifications: userProfile?.marketingnotifications || false,
    appupdates: userProfile?.appupdates || false,
    enable_location_services: userProfile?.enable_location_services ?? true,
  });

  const handlePreferenceChange = async (
    key: keyof typeof preferences,
    value: boolean
  ) => {
    if (!auth.user?.id) return;

    setPreferences((prev) => ({ ...prev, [key]: value }));
    await auth.updateUserPreferences(auth.user.id, { [key]: value });

    // If location services setting changed, refresh location service
    if (key === "enable_location_services" && userProfile) {
      try {
        // Get updated user profile and refresh location
        const updatedProfile = {
          ...userProfile,
          enable_location_services: value,
        };
        await locationService.refreshWithProfile(updatedProfile);
      } catch (error) {
        console.error(
          "Failed to refresh location after preference change:",
          error
        );
      }
    }
  };

  if (isLoadingProfile || isLoadingMembership) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-textPrimary">Laddar...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <AnimatedScreen>
        <ScrollView
          className="flex-1 bg-background"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
          <HeadingLeft title="" />

          <View className="px-4 mb-8">
            {userProfile?.avatar_url ? (
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={() => safeNavigate("/profile/edit-profile")}
                  className="relative"
                  activeOpacity={0.8}
                >
                  <Avatar
                    source={{ uri: userProfile.avatar_url }}
                    size={96}
                    rounded
                    containerStyle={{
                      borderWidth: 4,
                      borderColor: "#6366F1",
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  />
                  {/* Edit Icon */}
                  <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
                    <Pen size={16} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={() => safeNavigate("/profile/edit-profile")}
                  className="relative"
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: "#6366F1",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 4,
                      borderColor: "#4F46E5",
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 36,
                        fontWeight: "bold",
                      }}
                    >
                      {`${userProfile?.first_name?.[0] || ""}${
                        userProfile?.last_name?.[0] || ""
                      }`.toUpperCase()}
                    </Text>
                  </View>
                  {/* Edit Icon */}
                  <View
                    className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2"
                    style={{
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Edit3 size={16} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View className="items-center my-6">
              <Text className="text-textPrimary text-2xl font-bold mb-2">
                {`${userProfile?.first_name} ${userProfile?.last_name}`}
              </Text>
            </View>
          </View>

          <Section title="Ditt Medlemskap">
            {membership ? (
              <TouchableOpacity
                className="bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-3xl mt-4 mx-4 overflow-hidden"
                onPress={() => safeNavigate(ROUTES.PROFILE_MEMBERSHIP_DETAILS)}
                activeOpacity={0.9}
                style={{
                  shadowColor: "#6366F1",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 15,
                }}
              >
                {/* Premium Membership Card */}
                <View className="p-6 relative">
                  {/* Floating Badge */}
                  <View className="absolute top-4 right-4">
                    <View className="bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 flex-row items-center">
                      <Star size={14} color="#ffffff" fill="#ffffff" />
                      <Text className="text-white text-xs font-bold ml-1 tracking-wider">
                        AKTIV
                      </Text>
                    </View>
                  </View>

                  {/* Header */}
                  <View className="mb-6">
                    <Text className="text-white/80 text-sm font-semibold tracking-widest uppercase mb-1">
                      NUVARANDE PLAN
                    </Text>
                    <Text className="text-white text-3xl font-black tracking-tight">
                      {membership.plan_type || "Premium"}
                    </Text>
                    <Text className="text-white/70 text-sm font-medium">
                      Obegränsad access • Alla faciliteter
                    </Text>
                  </View>

                  {/* Stats Grid */}
                  <View className="flex-row mb-6 gap-3">
                    {/* Credits Card */}
                    <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <View className="flex-row items-center justify-between mb-2">
                        <Zap size={18} color="#ffffff" />
                        <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                          Krediter
                        </Text>
                      </View>
                      <Text className="text-white text-2xl font-black">
                        {membership.credits - (membership.credits_used || 0)}
                      </Text>
                      <Text className="text-white/60 text-xs">
                        av {membership.credits} totalt
                      </Text>
                    </View>

                    {/* Usage Card */}
                    <View className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                      <View className="flex-row items-center justify-between mb-2">
                        <Activity size={18} color="#ffffff" />
                        <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                          Använt
                        </Text>
                      </View>
                      <Text className="text-white text-2xl font-black">
                        {membership.credits_used || 0}
                      </Text>
                      <Text className="text-white/60 text-xs">
                        träningspass
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-white/70 text-xs font-semibold tracking-wide">
                        MÅNADSFÖRBRUKNING
                      </Text>
                      <Text className="text-white text-xs font-bold">
                        {Math.round(((membership.credits_used || 0) / membership.credits) * 100)}%
                      </Text>
                    </View>
                    <View className="bg-white/20 rounded-full h-2 overflow-hidden">
                      <View 
                        className="bg-white rounded-full h-full"
                        style={{ 
                          width: `${Math.min(((membership.credits_used || 0) / membership.credits) * 100, 100)}%` 
                        }}
                      />
                    </View>
                  </View>

                  {/* Action Hint */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                        <Settings size={16} color="#ffffff" />
                      </View>
                      <Text className="text-white/80 text-sm font-medium">
                        Hantera medlemskap
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#ffffff" opacity={0.7} />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-gradient-to-br from-surface via-background to-surface rounded-3xl mt-4 mx-4 border-2 border-dashed border-primary/30 overflow-hidden"
                onPress={() => safeNavigate(ROUTES.PROFILE_MEMBERSHIP_DETAILS)}
                activeOpacity={0.9}
                style={{
                  shadowColor: "#6366F1",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View className="p-8 items-center relative">
                  {/* Decorative Elements */}
                  <View className="absolute top-4 right-4 opacity-20">
                    <TrendingUp size={32} color="#6366F1" />
                  </View>
                  <View className="absolute top-8 left-4 opacity-10">
                    <Star size={24} color="#6366F1" />
                  </View>

                  {/* Main Icon */}
                  <View className="relative mb-6">
                    <View className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 items-center justify-center mb-2">
                      <CreditCard size={36} color="#6366F1" />
                    </View>
                    <View className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-black">+</Text>
                    </View>
                  </View>

                  {/* Content */}
                  <Text className="text-textPrimary text-xl font-black mb-2 text-center">
                    Inget aktivt medlemskap
                  </Text>
                  <Text className="text-textSecondary text-center mb-6 leading-relaxed">
                    Upptäck obegränsad träning på Stockholms 
                    bästa gym och träningscenter
                  </Text>

                  {/* Features */}
                  <View className="w-full mb-6">
                    <View className="flex-row items-center mb-3">
                      <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                      <Text className="text-textSecondary text-sm font-medium">
                        Tillgång till 500+ anläggningar
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-3">
                      <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                      <Text className="text-textSecondary text-sm font-medium">
                        Obegränsade träningspass
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-primary rounded-full mr-3" />
                      <Text className="text-textSecondary text-sm font-medium">
                        Premiumklasser & PT-sessioner
                      </Text>
                    </View>
                  </View>

                  {/* CTA Button */}
                  <View className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl py-4 px-8 w-full max-w-xs">
                    <View className="flex-row items-center justify-center">
                      <Calendar size={18} color="#ffffff" />
                      <Text className="text-white font-bold text-base ml-2 tracking-wide">
                        Välj medlemskap
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </Section>

          <Section title="Kontoinställningar">
            <View className="mx-4 mt-4 space-y-2">
              {[
                {
                  label: "Betalningsmetoder",
                  icon: CreditCard,
                  route: "/profile/payments/",
                  description: "Hantera dina kort och betalningsalternativ",
                },
                {
                  label: "Appinställningar",
                  icon: Settings,
                  route: "/app-settings",
                  description: "Anpassa din appupplevelse",
                },
              ].map(({ label, icon: Icon, route, description }, i) => (
                <TouchableOpacity
                  key={i}
                  className="bg-surface rounded-2xl p-4 mb-3"
                  onPress={() => router.push(route as any)}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                      <Icon size={24} color="#6366F1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-textPrimary text-lg font-semibold mb-1">
                        {label}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {description}
                      </Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                      <ChevronRight size={18} color="#A0A0A0" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          <Section title="Inställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
              {[
                {
                  label: "Mörkt läge",
                  key: "dark_mode" as const,
                  value: preferences.dark_mode,
                  description: "Använd mörkt tema i hela appen",
                },
                {
                  label: "Push-notifikationer",
                  key: "pushnotifications" as const,
                  value: preferences.pushnotifications,
                  description: "Få meddelanden om bokningar och uppdateringar",
                },
                {
                  label: "E-postuppdateringar",
                  key: "emailupdates" as const,
                  value: preferences.emailupdates,
                  description: "Ta emot nyhetsbrev och meddelanden",
                },
                {
                  label: "Klasspåminnelser",
                  key: "classreminders" as const,
                  value: preferences.classreminders,
                  description: "Få påminnelser innan dina klasser",
                },
                /*   {
                label: "Marketing Notifications",
                key: "marketingnotifications" as const,
                value: preferences.marketingnotifications,
                description: "Promotional offers and deals",
              },
              {
                label: "App Updates",
                key: "appupdates" as const,
                value: preferences.appupdates,
                description: "New features and app improvements",
              }, */
              ].map(({ label, key, value, description }, i) => (
                <View
                  key={i}
                  className={`flex-row justify-between items-center py-4 ${
                    i !== 5 ? "border-b border-accentGray/30" : ""
                  }`}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-textPrimary text-base font-medium mb-1">
                      {label}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {description}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{
                      false: "#374151",
                      true: "rgba(99, 102, 241, 0.4)",
                    }}
                    thumbColor={value ? "#6366F1" : "#9CA3AF"}
                    value={value}
                    onValueChange={(newValue) =>
                      handlePreferenceChange(key, newValue)
                    }
                    style={{
                      transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                    }}
                  />
                </View>
              ))}
            </View>
          </Section>

          <Section title="Platsinställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
              <View className="flex-row justify-between items-center pb-4 border-b border-accentGray/30">
                <View className="flex-1 mr-4">
                  <Text className="text-textPrimary text-base font-medium mb-1">
                    Aktivera platstjänster
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    Tillåt {process.env.APP_NAME} att använda din plats för
                    exakta avståndsberäkningar till gym
                  </Text>
                </View>
                <Switch
                  trackColor={{
                    false: "#374151",
                    true: "rgba(99, 102, 241, 0.4)",
                  }}
                  thumbColor={
                    preferences.enable_location_services ? "#6366F1" : "#9CA3AF"
                  }
                  value={preferences.enable_location_services}
                  onValueChange={(value) =>
                    handlePreferenceChange("enable_location_services", value)
                  }
                  style={{
                    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                  }}
                />
              </View>

              <TouchableOpacity
                className="flex-row justify-between items-center pt-4"
                onPress={() => router.push("/profile/location-settings" as any)}
              >
                <View className="flex-1">
                  <Text className="text-textPrimary text-base font-medium mb-1">
                    Standardplats
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    {userProfile?.default_location || "Stockholm, Sverige"}
                  </Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                  <ChevronRight size={18} color="#A0A0A0" />
                </View>
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="Support">
            <View className="mx-4 mt-4 space-y-2">
              {[
                {
                  label: "Hjälpcenter",
                  icon: HelpCircle,
                  route: "/help-center",
                  description: "Få svar på vanliga frågor",
                },
                {
                  label: "Integritetspolicy",
                  icon: Shield,
                  route: "/privacy-policy",
                  description: "Lär dig hur vi skyddar dina data",
                },
              ].map(({ label, icon: Icon, route, description }, i) => (
                <TouchableOpacity
                  key={i}
                  className="bg-surface rounded-2xl p-4 mb-3"
                  onPress={() => router.push(route as any)}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                      <Icon size={24} color="#6366F1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-textPrimary text-lg font-semibold mb-1">
                        {label}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {description}
                      </Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                      <ChevronRight size={18} color="#A0A0A0" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          <SignOutButton />

          <View className="items-center mb-8">
            <Text className="text-textSecondary text-sm">
              {process.env.APP_NAME} v1.0.0
            </Text>
          </View>
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
