import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { LabelSetting } from "@/src/components/ui/LabelSetting";
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
    Text,
    TouchableOpacity,
    View
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
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Redigera profil"
                description="Uppdatera din personliga information"
                icon={User}
                onPress={() => router.push("/profile/edit-profile" as any)}
                showBorder={true}
              />
              <LabelSetting
                label="Exportera data"
                description="Ladda ner en kopia av din data"
                icon={Shield}
                onPress={handleExportData}
              />
            </View>
          </Section>
          {/* App Appearance */}
          <Section title="Utseende">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Mörkt läge"
                description="Använd mörkt tema i hela appen"
                icon={settings.dark_mode ? Moon : Sun}
                value={settings.dark_mode}
                onValueChange={(value: boolean) => handleSettingChange("dark_mode", value)}
              />
            </View>
          </Section>
          {/* Notifications */}
          <Section title="Notifikationer">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Push-notifikationer"
                description="Få meddelanden om bokningar och uppdateringar"
                icon={Bell}
                value={settings.pushnotifications}
                onValueChange={(value: boolean) => handleSettingChange("pushnotifications", value)}
                showBorder={true}
              />
              <LabelSetting
                label="E-postuppdateringar"
                description="Ta emot nyhetsbrev och meddelanden"
                icon={Mail}
                value={settings.emailupdates}
                onValueChange={(value: boolean) => handleSettingChange("emailupdates", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Klasspåminnelser"
                description="Få påminnelser innan dina klasser"
                icon={Bell}
                value={settings.classreminders}
                onValueChange={(value: boolean) => handleSettingChange("classreminders", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Marknadsföringsmeddelanden"
                description="Erbjudanden och specialkampanjer"
                icon={Mail}
                value={settings.marketingnotifications}
                onValueChange={(value: boolean) => handleSettingChange("marketingnotifications", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Appuppdateringar"
                description="Nya funktioner och förbättringar"
                icon={Smartphone}
                value={settings.appupdates}
                onValueChange={(value: boolean) => handleSettingChange("appupdates", value)}
              />
            </View>
          </Section>
          {/* Security & Privacy */}
          <Section title="Säkerhet & Integritet">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Biometrisk autentisering"
                description={biometricAvailable 
                  ? "Använd fingeravtryck eller Face ID" 
                  : "Inte tillgängligt på denna enhet"}
                icon={Lock}
                value={settings.biometric_auth}
                disabled={!biometricAvailable}
                onValueChange={(value: boolean) => handleSettingChange("biometric_auth", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Automatisk säkerhetskopiering"
                description="Säkerhetskopiera data automatiskt"
                icon={Shield}
                value={settings.auto_backup}
                onValueChange={(value: boolean) => handleSettingChange("auto_backup", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Kraschrapportering"
                description="Hjälp oss förbättra appen"
                icon={Smartphone}
                value={settings.crash_reporting}
                onValueChange={(value: boolean) => handleSettingChange("crash_reporting", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Analysdata"
                description="Anonyma användningsstatistik"
                icon={Eye}
                value={settings.analytics}
                onValueChange={(value: boolean) => handleSettingChange("analytics", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Profilsynlighet"
                description="Låt andra användare se dina gympreferenser"
                icon={User}
                value={settings.profile_visibility}
                onValueChange={(value: boolean) => handleSettingChange("profile_visibility", value)}
              />
            </View>
          </Section>
          {/* Advanced Settings */}
          <Section title="Avancerade inställningar">
            <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
              <LabelSetting
                label="Offlineläge"
                description="Använd appen utan internetanslutning"
                icon={Globe}
                value={settings.offline_mode}
                onValueChange={(value: boolean) => handleSettingChange("offline_mode", value)}
                showBorder={true}
              />
              <LabelSetting
                label="Rensa cache"
                description="Frigör lagringsutrymme"
                icon={Trash2}
                onPress={handleClearCache}
              />
            </View>
          </Section>
          {/* Danger Zone */}
          <Section title="Farlig zon">
            <View className="bg-red-500/10 border border-red-500/20 rounded-3xl mx-4 mt-4 px-6 py-3">
              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={handleDeleteAccount}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-red-500/20">
                  <Trash2 size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-500 text-base font-medium mb-1">
                    Radera konto
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    Ta bort ditt konto och all associerad data permanent
                  </Text>
                </View>
                <ChevronRight size={20} color="#EF4444" />
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
