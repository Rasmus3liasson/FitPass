import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import colors from "../../constants/custom-colors";

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
  onForgotPassword?: () => void;
  fieldErrors?: FieldErrors;
}

const SignInForm = ({
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  onSubmit,
  onForgotPassword,
  fieldErrors = {},
}: SignInFormProps) => {
  return (
    <View className="space-y-8">
      <View>
        <Text className="text-textPrimary font-semibold mb-3 text-lg">E-post</Text>
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
        {fieldErrors.email && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.email}</Text>
        )}
      </View>

      <View>
        <Text className="text-textPrimary font-semibold mb-3 text-lg">Lösenord</Text>
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
        {fieldErrors.password && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.password}</Text>
        )}
      </View>

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

      <TouchableOpacity 
        className="items-center mt-1"
        onPress={onForgotPassword}
        disabled={isSubmitting}
      >
        <Text className="text-accentPurple font-medium text-sm">Glömt lösenord?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInForm;