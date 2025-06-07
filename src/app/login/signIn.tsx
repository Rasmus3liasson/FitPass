import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

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
    <View className="space-y-4">
      <TextInput
        className="rounded-lg border border-gray-300 p-3"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isSubmitting}
      />
      <TextInput
        className="rounded-lg border border-gray-300 p-3"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmitting}
      />
      <TouchableOpacity
        className={`rounded-lg ${isSubmitting ? "bg-blue-400" : "bg-blue-500"} p-3`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-center text-white font-semibold">
          {isSubmitting ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignInForm;
