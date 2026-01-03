import { FormField } from "@shared/components/FormField";
import colors from "@shared/constants/custom-colors";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface FieldErrors {
  [key: string]: string | undefined;
}

interface SignInFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
}

const SignInForm = ({
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: SignInFormProps) => {
  return (
    <View className="space-y-8">
      <FormField label="E-post" error={fieldErrors.email}>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-base border ${
            fieldErrors.email ? 'border-red-500' : 'border-accentGray'
          }`}
          placeholder="Ange din e-postadress"
          placeholderTextColor={colors.borderGray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSubmitting}
        />
      </FormField>

      <FormField label="Lösenord" error={fieldErrors.password}>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-base border ${
            fieldErrors.password ? 'border-red-500' : 'border-accentGray'
          }`}
          placeholder="Ange ditt lösenord"
          placeholderTextColor={colors.borderGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
      </FormField>

      <View className="pt-4 mt-6">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center shadow-lg ${
            isSubmitting ? "bg-accentPurple opacity-80" : "bg-accentPurple"
          }`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <Text className="text-textPrimary font-bold text-base">
            {isSubmitting ? "Loggar in..." : "Logga in"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignInForm;