import { View } from 'react-native';
import { Section } from '../Section';
import { LabelSetting } from '../ui/LabelSetting';

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
          value={pushNotifications}
          onValueChange={onPushNotificationsChange}
          showBorder={true}
        />
        <LabelSetting
          label="E-postuppdateringar"
          description="Ta emot nyhetsbrev och meddelanden"
          value={emailUpdates}
          onValueChange={onEmailUpdatesChange}
          showBorder={true}
        />
        <LabelSetting
          label="Klasspåminnelser"
          description="Få påminnelser innan dina klasser"
          value={classReminders}
          onValueChange={onClassRemindersChange}
          showBorder={true}
        />
        <LabelSetting
          label="Marknadsföringsmeddelanden"
          description="Erbjudanden och specialkampanjer"
          value={marketingNotifications}
          onValueChange={onMarketingNotificationsChange}
          showBorder={true}
        />
        <LabelSetting
          label="Appuppdateringar"
          description="Nya funktioner och förbättringar"
          value={appUpdates}
          onValueChange={onAppUpdatesChange}
        />
      </View>
    </Section>
  );
}
