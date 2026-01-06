import { useTheme } from "@shared/components/ThemeProvider";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { GDPRService } from "@shared/services/gdprService";
import { ArrowRight, Download, ShieldCheck, Trash } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export const PrivacySettingsScreen = () => {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const { showSuccess, showError, showInfo } = useGlobalFeedback();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    profileVisible: true,
    locationSharingEnabled: true,
    marketingEmailsEnabled: false,
    analyticsEnabled: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await GDPRService.getPrivacySettings(user.id);
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      showError("Fel", "Kunde inte ladda integritetsinställningar");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!user?.id) return;

    // Optimistic update
    const previousSettings = { ...settings };
    setSettings({ ...settings, [key]: value });

    setIsUpdating(true);
    try {
      const result = await GDPRService.updatePrivacySettings(user.id, {
        [key]: value,
      });

      if (!result.success) {
        // Revert on error
        setSettings(previousSettings);
        showError("Fel", result.error || "Kunde inte uppdatera inställningen");
      } else {
        showSuccess("Uppdaterat", "Inställningen har sparats");
      }
    } catch (error) {
      setSettings(previousSettings);
      showError("Fel", "Något gick fel");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;

    Alert.alert(
      "Exportera data",
      "Vill du ladda ner all din personliga data? Detta kan ta en stund.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Exportera",
          onPress: async () => {
            setIsExporting(true);
            try {
              const result = await GDPRService.exportUserData(user.id);
              
              if (result.success && result.data) {
                // In production, implement file download
                showSuccess(
                  "Export klar",
                  "Din data har exporterats. Kontrollera din e-post."
                );
                console.log("Exported data:", result.data);
              } else {
                showError("Fel", result.error || "Kunde inte exportera data");
              }
            } catch (error) {
              showError("Fel", "Något gick fel vid exporten");
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    Alert.alert(
      "Radera konto",
      "Är du säker på att du vill radera ditt konto? Detta går inte att ångra. All din data kommer att tas bort permanent.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Radera",
          style: "destructive",
          onPress: () => {
            // Double confirmation
            Alert.alert(
              "Bekräfta radering",
              "Detta är din sista varning. Ditt konto och all data kommer att raderas permanent. Fortsätt?",
              [
                { text: "Nej, avbryt", style: "cancel" },
                {
                  text: "Ja, radera allt",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      const result = await GDPRService.requestDataDeletion(user.id);
                      
                      if (result.success) {
                        showSuccess(
                          "Konto raderat",
                          "Ditt konto har markerats för radering. Detta kan ta upp till 30 dagar att slutföra."
                        );
                        
                        // Sign out user
                        setTimeout(() => {
                          signOut();
                        }, 2000);
                      } else {
                        showError("Fel", result.error || "Kunde inte radera kontot");
                      }
                    } catch (error) {
                      showError("Fel", "Något gick fel vid raderingen");
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <ShieldCheck size={32} color={colors.primary} weight="duotone" />
            <Text className="text-2xl font-bold text-textPrimary ml-3">
              Integritet & Säkerhet
            </Text>
          </View>
          <Text className="text-textSecondary text-sm">
            Hantera dina integritetsinställningar och GDPR-rättigheter
          </Text>
        </View>

        {/* Privacy Settings */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-textPrimary mb-4">
            Integritetsinställningar
          </Text>

          <SettingToggle
            title="Visa profil offentligt"
            description="Andra användare kan se din profil"
            value={settings.profileVisible}
            onValueChange={(value) => updateSetting("profileVisible", value)}
            disabled={isUpdating}
          />

          <SettingToggle
            title="Aktivera platsdelning"
            description="Dela din plats för att hitta närliggande gym"
            value={settings.locationSharingEnabled}
            onValueChange={(value) => updateSetting("locationSharingEnabled", value)}
            disabled={isUpdating}
          />

          <SettingToggle
            title="Marknadsföringsmail"
            description="Ta emot erbjudanden och nyheter via e-post"
            value={settings.marketingEmailsEnabled}
            onValueChange={(value) => updateSetting("marketingEmailsEnabled", value)}
            disabled={isUpdating}
          />

          <SettingToggle
            title="Analytics"
            description="Hjälp oss förbättra appen genom att dela användningsdata"
            value={settings.analyticsEnabled}
            onValueChange={(value) => updateSetting("analyticsEnabled", value)}
            disabled={isUpdating}
            isLast
          />
        </View>

        {/* GDPR Actions */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-textPrimary mb-4">
            Dina rättigheter (GDPR)
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-borderGray"
            onPress={handleExportData}
            disabled={isExporting}
          >
            <View className="flex-row items-center flex-1">
              <Download size={24} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-textPrimary font-medium">
                  Exportera min data
                </Text>
                <Text className="text-textSecondary text-sm">
                  Ladda ner all din personliga data
                </Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ArrowRight size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4"
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <View className="flex-row items-center flex-1">
              <Trash size={24} color={colors.accentRed} />
              <View className="ml-3 flex-1">
                <Text className="text-accentRed font-medium">
                  Radera mitt konto
                </Text>
                <Text className="text-textSecondary text-sm">
                  Permanent radering av all data
                </Text>
              </View>
            </View>
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.accentRed} />
            ) : (
              <ArrowRight size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-surface/50 rounded-xl p-4">
          <Text className="text-textSecondary text-xs leading-5">
            <Text className="font-semibold">GDPR-information: </Text>
            Du har rätt att få tillgång till, korrigera och radera din personliga
            data. Dataexport levereras inom 30 dagar. Kontoradering är permanent
            och kan inte ångras.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

interface SettingToggleProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled,
  isLast,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        !isLast ? "border-b border-borderGray" : ""
      }`}
    >
      <View className="flex-1 mr-4">
        <Text className="text-textPrimary font-medium mb-1">{title}</Text>
        <Text className="text-textSecondary text-sm">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: isDark ? colors.borderGray : colors.lightBorderGray,
          true: colors.primary,
        }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
};
