import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function NotificationSettingsScreen() {
  const auth = useAuth();
  const { data: userProfile } = useUserProfile(auth.user?.id || "");
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
      appupdates: "App Updates"
    };
    
    const success = await auth.updateUserPreferences(auth.user.id, { [key]: value });
    if (success) {
      Toast.show({
        type: "success",
        text1: "✅ Setting Updated",
        text2: `${settingLabels[key]} ${value ? 'enabled' : 'disabled'} successfully`,
        position: "top",
        visibilityTime: 3000,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "❌ Update Failed",
        text2: `Couldn't update ${settingLabels[key]}. Please try again.`,
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-textPrimary text-2xl font-bold mt-4 mb-6">Notification Settings</Text>
        <View className="bg-surface rounded-2xl overflow-hidden">
          {[
            { label: "Push Notifications", key: "pushnotifications" },
            { label: "Email Updates", key: "emailupdates" },
            { label: "Class Reminders", key: "classreminders" },
            { label: "Marketing Notifications", key: "marketingnotifications" },
            { label: "App Updates", key: "appupdates" },
          ].map(({ label, key }, i) => (
            <View
              key={key}
              className={`flex-row justify-between items-center px-4 py-4 border-b border-borderGray ${i === 4 ? "border-b-0" : ""}`}
            >
              <Text className="text-textPrimary text-base">{label}</Text>
              <Switch
                trackColor={{
                  false: "#3e3e3e",
                  true: "rgba(99, 102, 241, 0.4)",
                }}
                thumbColor="#6366F1"
                value={settings[key as keyof typeof settings]}
                onValueChange={(newValue) => handleToggle(key as keyof typeof settings, newValue)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
} 