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
    pushNotifications: false,
    emailUpdates: false,
    classReminders: false,
    marketingNotifications: false,
    appUpdates: false,
  });

  useEffect(() => {
    if (userProfile) {
      setSettings({
        pushNotifications: userProfile.pushNotifications ?? false,
        emailUpdates: userProfile.emailUpdates ?? false,
        classReminders: userProfile.classReminders ?? false,
        marketingNotifications: userProfile.marketingNotifications ?? false,
        appUpdates: userProfile.appUpdates ?? false,
      });
    }
  }, [userProfile]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (!auth.user?.id) return;
    const success = await auth.updateUserPreferences(auth.user.id, { [key]: value });
    if (success) {
      Toast.show({
        type: "success",
        text1: "Settings Updated",
        text2: `Your ${key} preference has been updated`,
        position: "bottom",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: `Could not update your ${key} preference`,
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-bold mt-4 mb-6">Notification Settings</Text>
        <View className="bg-surface rounded-2xl overflow-hidden">
          {[
            { label: "Push Notifications", key: "pushNotifications" },
            { label: "Email Updates", key: "emailUpdates" },
            { label: "Class Reminders", key: "classReminders" },
            { label: "Marketing Notifications", key: "marketingNotifications" },
            { label: "App Updates", key: "appUpdates" },
          ].map(({ label, key }, i) => (
            <View
              key={key}
              className={`flex-row justify-between items-center px-4 py-4 border-b border-borderGray ${i === 4 ? "border-b-0" : ""}`}
            >
              <Text className="text-white text-base">{label}</Text>
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