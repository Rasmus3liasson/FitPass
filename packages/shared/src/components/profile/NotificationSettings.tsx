import { Section } from "@/components/Section";
import { LabelSetting } from "../components/ui/LabelSetting";
import { Bell, Mail, Smartphone } from "lucide-react-native";
import { View } from "react-native";

interface NotificationSettingsProps {
  pushNotifications: boolean;
  emailUpdates: boolean;
  classReminders: boolean;
  marketingNotifications: boolean;
  appUpdates: boolean;
  onPushNotificationsChange: (value: boolean) => void;
  onEmailUpdatesChange: (value: boolean) => void;
  onClassRemindersChange: (value: boolean) => void;
  onMarketingNotificationsChange: (value: boolean) => void;
  onAppUpdatesChange: (value: boolean) => void;
}

export function NotificationSettings({
  pushNotifications,
  emailUpdates,
  classReminders,
  marketingNotifications,
  appUpdates,
  onPushNotificationsChange,
  onEmailUpdatesChange,
  onClassRemindersChange,
  onMarketingNotificationsChange,
  onAppUpdatesChange,
}: NotificationSettingsProps) {
  return (
    <Section title="Notifikationer">
      <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
        <LabelSetting
          label="Push-notifikationer"
          description="Få meddelanden om bokningar och uppdateringar"
          icon={Bell}
          value={pushNotifications}
          onValueChange={onPushNotificationsChange}
          showBorder={true}
        />
        <LabelSetting
          label="E-postuppdateringar"
          description="Ta emot nyhetsbrev och meddelanden"
          icon={Mail}
          value={emailUpdates}
          onValueChange={onEmailUpdatesChange}
          showBorder={true}
        />
        <LabelSetting
          label="Klasspåminnelser"
          description="Få påminnelser innan dina klasser"
          icon={Bell}
          value={classReminders}
          onValueChange={onClassRemindersChange}
          showBorder={true}
        />
        <LabelSetting
          label="Marknadsföringsmeddelanden"
          description="Erbjudanden och specialkampanjer"
          icon={Mail}
          value={marketingNotifications}
          onValueChange={onMarketingNotificationsChange}
          showBorder={true}
        />
        <LabelSetting
          label="Appuppdateringar"
          description="Nya funktioner och förbättringar"
          icon={Smartphone}
          value={appUpdates}
          onValueChange={onAppUpdatesChange}
        />
      </View>
    </Section>
  );
}
