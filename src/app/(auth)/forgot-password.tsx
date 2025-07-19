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
        <Text className="text-gray-400 text-sm text-center leading-5">
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-base">Email</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-base border ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-600'
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
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.email}</Text>
        )}
      </View>

      <View className="pt-2 mt-5">
        <TouchableOpacity
          className={`rounded-xl py-4 items-center shadow-lg ${
            isSubmitting ? "bg-indigo-400" : "bg-indigo-500"
          }`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <Text className="text-white font-bold text-base">
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordForm;
