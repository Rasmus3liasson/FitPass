import { Section } from "../Section";
import { LabelSetting } from "../components/ui/LabelSetting";
import { Eye, Lock, Shield, Smartphone, User } from "lucide-react-native";
import { View } from "react-native";

interface SecurityPrivacySettingsProps {
  biometricAuth: boolean;
  biometricAvailable: boolean;
  autoBackup: boolean;
  crashReporting: boolean;
  analytics: boolean;
  profileVisibility: boolean;
  onBiometricAuthChange: (value: boolean) => void;
  onAutoBackupChange: (value: boolean) => void;
  onCrashReportingChange: (value: boolean) => void;
  onAnalyticsChange: (value: boolean) => void;
  onProfileVisibilityChange: (value: boolean) => void;
}

export function SecurityPrivacySettings({
  biometricAuth,
  biometricAvailable,
  autoBackup,
  crashReporting,
  analytics,
  profileVisibility,
  onBiometricAuthChange,
  onAutoBackupChange,
  onCrashReportingChange,
  onAnalyticsChange,
  onProfileVisibilityChange,
}: SecurityPrivacySettingsProps) {
  return (
    <Section title="Säkerhet & Integritet">
      <View className="bg-surface rounded-3xl mx-4 mt-4 px-6 py-3">
        <LabelSetting
          label="Biometrisk autentisering"
          description={
            biometricAvailable
              ? "Använd fingeravtryck eller Face ID"
              : "Inte tillgängligt på denna enhet"
          }
          icon={Lock}
          value={biometricAuth}
          disabled={!biometricAvailable}
          onValueChange={onBiometricAuthChange}
          showBorder={true}
        />
        <LabelSetting
          label="Automatisk säkerhetskopiering"
          description="Säkerhetskopiera data automatiskt"
          icon={Shield}
          value={autoBackup}
          onValueChange={onAutoBackupChange}
          showBorder={true}
        />
        <LabelSetting
          label="Kraschrapportering"
          description="Hjälp oss förbättra appen"
          icon={Smartphone}
          value={crashReporting}
          onValueChange={onCrashReportingChange}
          showBorder={true}
        />
        <LabelSetting
          label="Analysdata"
          description="Anonyma användningsstatistik"
          icon={Eye}
          value={analytics}
          onValueChange={onAnalyticsChange}
          showBorder={true}
        />
        <LabelSetting
          label="Profilsynlighet"
          description="Låt andra användare se dina gympreferenser"
          icon={User}
          value={profileVisibility}
          onValueChange={onProfileVisibilityChange}
        />
      </View>
    </Section>
  );
}
