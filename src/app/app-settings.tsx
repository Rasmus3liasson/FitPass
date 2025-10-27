import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { useSettings } from "@/src/hooks/useSettings";
import { useRouter } from "expo-router";
import {
    Bell,
    ChevronRight,
    Eye,
    Globe,
    Lock,
    Mail,
    Moon,
    Shield,
    Smartphone,
    Sun,
    Trash2,
    User,
} from "lucide-react-native";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AppSettingsScreen() {
  const router = useRouter();
  const {
    settings,
    isLoading,
    biometricAvailable,
    updateSetting,
    enableBiometricAuth,
    clearCache,
    exportData,
  } = useSettings();
  
  const [updatingSettings, setUpdatingSettings] = React.useState<Set<string>>(new Set());

  const handleSettingChange = async (
    key: keyof typeof settings,
    value: boolean | string
  ) => {
    // Add to updating settings
    setUpdatingSettings(prev => new Set([...prev, key]));
    
    try {
      if (key === 'biometric_auth' && value === true) {
        // Special handling for biometric authentication
        if (!biometricAvailable) {
          Alert.alert(
            "Biometrisk autentisering",
            "Biometrisk autentisering är inte tillgänglig på denna enhet.",
            [{ text: "OK" }]
          );
          return;
        }
        await enableBiometricAuth();
      } else {
        await updateSetting(key, value);
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      
      // More specific error messages
      let errorMessage = "Kunde inte uppdatera inställningen. Försök igen.";
      
      if (key === 'biometric_auth') {
        errorMessage = "Kunde inte aktivera biometrisk autentisering. Kontrollera att du har konfigurerat fingeravtryck eller Face ID på din enhet.";
      } else if (key === 'dark_mode') {
        errorMessage = "Kunde inte ändra tema. Försök igen.";
      } else if (key.includes('notification')) {
        errorMessage = "Kunde inte uppdatera notifieringsinställningar. Kontrollera dina enhetsinställningar.";
      }
      
      Alert.alert("Fel", errorMessage, [{ text: "OK" }]);
    } finally {
      // Remove from updating settings
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Radera konto",
      "Är du säker på att du vill radera ditt konto? Denna åtgärd kan inte ångras och all din data kommer att tas bort permanent.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Radera konto",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Bekräftelse krävs",
              "För att radera ditt konto behöver du kontakta vår support. Du kommer att omdirigeras till hjälpcentret.",
              [
                { text: "Avbryt", style: "cancel" },
                {
                  text: "Kontakta support",
                  onPress: () => router.push("/help-center" as any),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      await exportData();
      Alert.alert(
        "Data exporterad",
        "Din data har exporterats framgångsrikt. Kontakta support för att få din datafil.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Fel",
        "Kunde inte exportera data. Försök igen senare.",
        [{ text: "OK" }]
      );
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Rensa cache",
      "Är du säker på att du vill rensa appens cache? Detta kan påverka prestandan tillfälligt.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Rensa",
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert(
                "Cache rensad",
                "Appens cache har rensats framgångsrikt."
              );
            } catch (error) {
              Alert.alert(
                "Fel",
                "Kunde inte rensa cache. Försök igen.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper edges={["top"]}>
        <PageHeader
          title="Appinställningar"
          variant="minimal"
          showBackButton={true}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textSecondary text-sm mt-4">
            Laddar inställningar...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={["top"]}>
      <AnimatedScreen>
        <PageHeader
          title="Appinställningar"
          variant="minimal"
          showBackButton={true}
        />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Account Settings */}
          <Section title="Kontoinställningar">
            <View className="mx-4 mt-4 space-y-3">
              {[
                {
                  label: "Redigera profil",
                  icon: User,
                  route: "/profile/edit-profile",
                  description: "Uppdatera din personliga information",
                },
                {
                  label: "Exportera data",
                  icon: Shield,
                  action: "export-data",
                  description: "Ladda ner en kopia av din data",
                },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-surface rounded-2xl p-5 border border-white/5"
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                    } else if (item.action === "export-data") {
                      handleExportData();
                    }
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center mr-5 bg-primary/10">
                      <item.icon size={22} color="#6366F1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-textPrimary text-base font-semibold mb-1">
                        {item.label}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {item.description}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#A0A0A0" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
          {/* App Appearance */}
          <Section title="Utseende">
            <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    {settings.dark_mode ? (
                      <Moon size={20} color="#6366F1" className="mr-2" />
                    ) : (
                      <Sun size={20} color="#6366F1" className="mr-2" />
                    )}
                    <Text className="text-textPrimary text-base font-medium">
                      Mörkt läge
                    </Text>
                  </View>
                  <Text className="text-textSecondary text-sm">
                    Använd mörkt tema i hela appen
                  </Text>
                </View>
                <Switch
                  trackColor={{
                    false: "#374151",
                    true: "rgba(99, 102, 241, 0.4)",
                  }}
                  thumbColor={settings.dark_mode ? "#6366F1" : "#9CA3AF"}
                  value={settings.dark_mode}
                  onValueChange={(value) =>
                    handleSettingChange("dark_mode", value)
                  }
                  style={{
                    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                  }}
                />
              </View>
            </View>
          </Section>
          {/* Notifications */}
          <Section title="Notifikationer">
            <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
              {[
                {
                  label: "Push-notifikationer",
                  key: "pushnotifications" as const,
                  icon: Bell,
                  value: settings.pushnotifications,
                  description: "Få meddelanden om bokningar och uppdateringar",
                },
                {
                  label: "E-postuppdateringar",
                  key: "emailupdates" as const,
                  icon: Mail,
                  value: settings.emailupdates,
                  description: "Ta emot nyhetsbrev och meddelanden",
                },
                {
                  label: "Klasspåminnelser",
                  key: "classreminders" as const,
                  icon: Bell,
                  value: settings.classreminders,
                  description: "Få påminnelser innan dina klasser",
                },
                {
                  label: "Marknadsföringsmeddelanden",
                  key: "marketingnotifications" as const,
                  icon: Mail,
                  value: settings.marketingnotifications,
                  description: "Erbjudanden och specialkampanjer",
                },
                {
                  label: "Appuppdateringar",
                  key: "appupdates" as const,
                  icon: Smartphone,
                  value: settings.appupdates,
                  description: "Nya funktioner och förbättringar",
                },
              ].map(
                ({ label, key, icon: Icon, value, description }, i, array) => (
                  <View
                    key={i}
                    className={`flex-row justify-between items-center py-4 ${
                      i !== array.length - 1 ? "border-b border-white/10" : ""
                    }`}
                  >
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-2">
                        <Icon size={18} color="#6366F1" className="mr-3" />
                        <Text className="text-textPrimary text-base font-medium">
                          {label}
                        </Text>
                      </View>
                      <Text className="text-textSecondary text-sm ml-6">
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
                        handleSettingChange(key, newValue)
                      }
                      style={{
                        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                      }}
                    />
                  </View>
                )
              )}
            </View>
          </Section>
          {/* Security & Privacy */}
          <Section title="Säkerhet & Integritet">
            <View className="bg-surface rounded-3xl mx-4 mt-4 p-6">
              {[
                {
                  label: "Biometrisk autentisering",
                  key: "biometric_auth" as const,
                  icon: Lock,
                  value: settings.biometric_auth,
                  description: biometricAvailable 
                    ? "Använd fingeravtryck eller Face ID" 
                    : "Inte tillgängligt på denna enhet",
                  disabled: !biometricAvailable,
                },
                {
                  label: "Automatisk säkerhetskopiering",
                  key: "auto_backup" as const,
                  icon: Shield,
                  value: settings.auto_backup,
                  description: "Säkerhetskopiera data automatiskt",
                  disabled: false,
                },
                {
                  label: "Kraschrapportering",
                  key: "crash_reporting" as const,
                  icon: Smartphone,
                  value: settings.crash_reporting,
                  description: "Hjälp oss förbättra appen",
                  disabled: false,
                },
                {
                  label: "Analysdata",
                  key: "analytics" as const,
                  icon: Eye,
                  value: settings.analytics,
                  description: "Anonyma användningsstatistik",
                  disabled: false,
                },
              ].map(
                ({ label, key, icon: Icon, value, description, disabled }, i, array) => (
                  <View
                    key={i}
                    className={`flex-row justify-between items-center py-4 ${
                      i !== array.length - 1 ? "border-b border-white/10" : ""
                    } ${disabled ? "opacity-50" : ""}`}
                  >
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center mb-2">
                        <Icon size={18} color="#6366F1" className="mr-3" />
                        <Text className="text-textPrimary text-base font-medium">
                          {label}
                        </Text>
                      </View>
                      <Text className="text-textSecondary text-sm ml-6">
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
                      disabled={disabled}
                      onValueChange={(newValue) =>
                        handleSettingChange(key, newValue)
                      }
                      style={{
                        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                      }}
                    />
                  </View>
                )
              )}
            </View>
          </Section>
          {/* Advanced Settings */}
          <Section title="Avancerade inställningar">
            <View className="mx-4 mt-4 space-y-3">
              <View className="bg-surface rounded-3xl p-6">
                <View className="flex-row justify-between items-center py-4 border-b border-white/10">
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-2">
                      <Globe size={18} color="#6366F1" className="mr-3" />
                      <Text className="text-textPrimary text-base font-medium">
                        Offlineläge
                      </Text>
                    </View>
                    <Text className="text-textSecondary text-sm ml-6">
                      Använd appen utan internetanslutning
                    </Text>
                  </View>
                  <Switch
                    trackColor={{
                      false: "#374151",
                      true: "rgba(99, 102, 241, 0.4)",
                    }}
                    thumbColor={settings.offline_mode ? "#6366F1" : "#9CA3AF"}
                    value={settings.offline_mode}
                    onValueChange={(newValue) =>
                      handleSettingChange("offline_mode", newValue)
                    }
                    style={{
                      transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
                    }}
                  />
                </View>
              </View>
              
              <TouchableOpacity
                className="bg-surface rounded-2xl p-5 border border-white/5"
                onPress={handleClearCache}
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-full items-center justify-center mr-5 bg-primary/10">
                    <Trash2 size={22} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textPrimary text-base font-semibold mb-1">
                      Rensa cache
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      Frigör lagringsutrymme
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#A0A0A0" />
                </View>
              </TouchableOpacity>
            </View>
          </Section>
          {/* Danger Zone */}
          <Section title="Farlig zon">
            <View className="mx-4 mt-4">
              <TouchableOpacity
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5"
                onPress={handleDeleteAccount}
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-full items-center justify-center mr-5 bg-red-500/20">
                    <Trash2 size={22} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-500 text-base font-semibold mb-1">
                      Radera konto
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      Ta bort ditt konto och all associerad data permanent
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#EF4444" />
                </View>
              </TouchableOpacity>
            </View>
          </Section>
          {/* Bottom Padding */}
          <View className="h-12" />
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
