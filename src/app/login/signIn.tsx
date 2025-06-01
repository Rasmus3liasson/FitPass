import React from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;


  onSocialSignIn: (provider: "google" | "facebook") => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  formError,
  onSubmit,
  onSocialSignIn,
}: LoginFormProps) => {
  React.useEffect(() => {
    if (formError) {
      Toast.show({
        type: "error",
        text1: "Fel",
        text2: formError,
      });
    }
  }, [formError]);

  return (
    <View className="p-4 bg-background flex-1 justify-center">
      {/* Email */}
      <Text className="mb-1 text-textPrimary font-semibold">E-post</Text>
      <TextInput
        className="border border-gray-600 rounded-md px-4 py-3 mb-4 text-textPrimary bg-surface"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isSubmitting}
        placeholder="example@mail.com"
        placeholderTextColor="#A0A0A0"
      />

      {/* Password */}
      <Text className="mb-1 text-textPrimary font-semibold">Lösenord</Text>
      <TextInput
        className="border border-gray-600 rounded-md px-4 py-3 mb-6 text-textPrimary bg-surface"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmitting}
        placeholder="••••••••"
        placeholderTextColor="#A0A0A0"
      />

      {/* Submit button */}
      <TouchableOpacity
        className={`rounded-md py-3 mb-6 items-center ${
          isSubmitting ? "bg-primary/60" : "bg-primary"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white font-bold text-lg">Logga in</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-600" />
        <Text className="mx-3 text-textSecondary">Eller fortsätt med</Text>
        <View className="flex-1 h-px bg-gray-600" />
      </View>

      {/* Social buttons */}
      <View className="flex-row space-x-4">
        <TouchableOpacity
          className="flex-1 border border-primary rounded-md py-3 items-center"
          onPress={() => onSocialSignIn("google")}
          disabled={isSubmitting}
        >
          <Text className="text-primary font-semibold">Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 border border-primary rounded-md py-3 items-center"
          onPress={() => onSocialSignIn("facebook")}
          disabled={isSubmitting}
        >
          <Text className="text-primary font-semibold">Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginForm;
