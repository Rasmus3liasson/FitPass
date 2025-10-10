import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";

interface FieldErrors {
  [key: string]: string | undefined;
}

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
}

const ForgotPasswordForm = ({
  email,
  setEmail,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: ForgotPasswordFormProps) => {
  return (
    <View className="space-y-6">{/* Increased from space-y-5 to space-y-6 */}
      <View className="mb-2">
        <Text className="text-accentGray text-sm text-center leading-5">
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View>
        <Text className="text-textPrimary font-semibold mb-2 text-base">Email</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-base border ${
            fieldErrors.email ? 'border-accentRed' : 'border-borderGray'
          }`}
          placeholder="Enter your email"
          placeholderTextColor={colors.borderGray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSubmitting}
        />
        {fieldErrors.email && (
          <Text className="text-accentRed text-sm mt-1">{fieldErrors.email}</Text>
        )}
      </View>

      <View className="pt-2 mt-5">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center shadow-lg ${
            isSubmitting ? "bg-accentPurple" : "bg-primary"
          }`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <Text className="text-textPrimary font-bold text-base">
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordForm;
