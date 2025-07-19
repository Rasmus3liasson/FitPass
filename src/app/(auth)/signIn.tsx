import React from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import colors from "../../constants/custom-colors";

interface SignInFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
}

const SignInForm = ({
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  onSubmit,
}: SignInFormProps) => {
  return (
    <View className="space-y-6">
      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Email</Text>
        <TextInput
          className="bg-accentGray border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="Enter your email"
          placeholderTextColor={colors.borderGray}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSubmitting}
        />
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Password</Text>
        <TextInput
          className="bg-accentGray border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="Enter your password"
          placeholderTextColor={colors.borderGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg ${
          isSubmitting ? "bg-indigo-400" : "bg-indigo-500"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-white font-bold text-lg">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center mt-4">
        <Text className="text-indigo-400 font-medium">Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInForm;