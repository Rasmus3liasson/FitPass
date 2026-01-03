import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { SettingsSection } from "@shared/components/ui/SettingsSection";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";

export default function NotificationSettingsScreen() {
  const auth = useAuth();
  const { data: userProfile } = useUserProfile(auth.user?.id || "");
  const { showSuccess, showError } = useGlobalFeedback();
  const [settings, setSettings] = useState({
    pushnotifications: false,
    emailupdates: false,
    classreminders: false,
    marketingnotifications: false,
    appupdates: false,
  });

  useEffect(() => {
    if (userProfile) {
      setSettings({
        pushnotifications: userProfile.pushnotifications ?? false,
        emailupdates: userProfile.emailupdates ?? false,
        classreminders: userProfile.classreminders ?? false,
        marketingnotifications: userProfile.marketingnotifications ?? false,
        appupdates: userProfile.appupdates ?? false,
      });
    }
  }, [userProfile]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (!auth.user?.id) return;

    // Get a user-friendly label for the setting
    const settingLabels: Record<keyof typeof settings, string> = {
      pushnotifications: "Push Notifications",
      emailupdates: "Email Updates",
      classreminders: "Class Reminders",
      marketingnotifications: "Marketing Notifications",
      appupdates: "App Updates",
    };

    const success = await auth.updateUserPreferences(auth.user.id, {
      [key]: value,
    });
    if (success) {
      showSuccess(
        "✅ Setting Updated",
        `${settingLabels[key]} ${value ? "enabled" : "disabled"} successfully`
      );
    } else {
      showError(
        "❌ Update Failed",
        `Couldn't update ${settingLabels[key]}. Please try again.`
      );
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-textPrimary text-2xl font-bold mt-4 mb-6">
          Notification Settings
        </Text>
        <SettingsSection
          containerStyle="bg-surface rounded-2xl overflow-hidden"
          items={[
            {
              label: "Push Notifications",
              key: "pushnotifications",
              value: settings.pushnotifications,
              onValueChange: (value) =>
                handleToggle("pushnotifications", value),
            },
            {
              label: "Email Updates",
              key: "emailupdates",
              value: settings.emailupdates,
              onValueChange: (value) => handleToggle("emailupdates", value),
            },
            {
              label: "Class Reminders",
              key: "classreminders",
              value: settings.classreminders,
              onValueChange: (value) => handleToggle("classreminders", value),
            },
            {
              label: "Marketing Notifications",
              key: "marketingnotifications",
              value: settings.marketingnotifications,
              onValueChange: (value) =>
                handleToggle("marketingnotifications", value),
            },
            {
              label: "App Updates",
              key: "appupdates",
              value: settings.appupdates,
              onValueChange: (value) => handleToggle("appupdates", value),
            },
          ]}
          switchColors={{
            trackColorFalse: "#3e3e3e",
            trackColorTrue: "rgba(99, 102, 241, 0.4)",
            thumbColorActive: colors.primary,
            thumbColorInactive: colors.primary,
          }}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
