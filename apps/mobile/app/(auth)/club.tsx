import { FormField } from "@shared/components/FormField";
import colors from "@shared/constants/custom-colors";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FieldErrors {
  [key: string]: string | undefined;
}

interface ClubLoginFormProps {
  clubEmail: string;
  setClubEmail: (v: string) => void;
  clubPassword: string;
  setClubPassword: (v: string) => void;
  orgNumber: string;
  setOrgNumber: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
}


const ClubLoginForm = ({
  clubEmail,
  setClubEmail,
  clubPassword,
  setClubPassword,
  orgNumber,
  setOrgNumber,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: ClubLoginFormProps) => {
  return (
    <View className="space-y-8">
      <FormField label="Klubb E-post" error={fieldErrors.email}>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.email ? "border-accentRed" : "border-accentGray"
          }`}
          placeholder="klubb@exempel.se"
          placeholderTextColor={colors.borderGray}
          value={clubEmail}
          onChangeText={setClubEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Lösenord" error={fieldErrors.password}>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.password ? "border-accentRed" : "border-accentGray"
          }`}
          placeholder="••••••••"
          placeholderTextColor={colors.borderGray}
          value={clubPassword}
          onChangeText={setClubPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Organisationsnummer (Valfritt)" error={fieldErrors.orgNumber}>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.orgNumber ? "border-accentRed" : "border-accentGray"
          }`}
          placeholder="XXXXXX-XXXX"
          placeholderTextColor={colors.borderGray}
          value={orgNumber}
          onChangeText={setOrgNumber}
          editable={!isSubmitting}
        />
      </FormField>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-5 ${
          isSubmitting ? "bg-accentPurple" : "bg-primary"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text className="text-textPrimary font-bold text-lg">Logga in som klubb</Text>
        )}
      </TouchableOpacity>

      <Text className="text-textSecondary text-center text-sm mt-4">
        För att skapa ett klubbkonto, kontakta {process.env.EXPO_PUBLIC_APP_NAME}
      </Text>
    </View>
  );
};

export default ClubLoginForm;
