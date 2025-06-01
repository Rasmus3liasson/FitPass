import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

interface RegisterFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  isSubmitting: boolean;
  formError: string | null;
  successMessage: string | null;
  onSubmit: (e: React.FormEvent) => void;

  onSocialSignIn: (provider: "google" | "facebook") => void;
}

const RegisterForm = ({
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  location,
  setLocation,
  isSubmitting,
  formError,
  successMessage,
  onSubmit,
  onSocialSignIn,
}: RegisterFormProps) => {
  useEffect(() => {
    if (formError) {
      Toast.show({ type: "error", text1: "Fel", text2: formError });
    }
    if (successMessage) {
      Toast.show({ type: "success", text1: "Succé", text2: successMessage });
    }
  }, [formError, successMessage]);

  return (
    <View className="flex-1 bg-background p-4 justify-center">
      {/* Name Inputs */}
      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <Text className="text-textPrimary mb-1 font-semibold">Förnamn*</Text>
          <TextInput
            className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isSubmitting}
            placeholder="Förnamn"
            placeholderTextColor="#A0A0A0"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-1 font-semibold">Efternamn</Text>
          <TextInput
            className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
            value={lastName}
            onChangeText={setLastName}
            editable={!isSubmitting}
            placeholder="Efternamn"
            placeholderTextColor="#A0A0A0"
          />
        </View>
      </View>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-1 font-semibold">E-post*</Text>
        <TextInput
          className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
          placeholder="example@mail.com"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Phone & Location */}
      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <Text className="text-textPrimary mb-1 font-semibold">Telefon</Text>
          <TextInput
            className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isSubmitting}
            placeholder="Telefon"
            placeholderTextColor="#A0A0A0"
          />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary mb-1 font-semibold">Ort</Text>
          <TextInput
            className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
            value={location}
            onChangeText={setLocation}
            editable={!isSubmitting}
            placeholder="Ort"
            placeholderTextColor="#A0A0A0"
          />
        </View>
      </View>

      {/* Password */}
      <View className="mb-6">
        <Text className="text-textPrimary mb-1 font-semibold">Lösenord*</Text>
        <TextInput
          className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isSubmitting}
          placeholder="••••••••"
          placeholderTextColor="#A0A0A0"
        />
        <Text className="text-xs text-gray-500 mt-1">
          Lösenordet måste vara minst 6 tecken
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        className={`rounded-md py-3 mb-6 items-center ${
          isSubmitting ? "bg-primary/60" : "bg-primary"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Skapa konto</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-600" />
        <Text className="mx-3 text-textSecondary">Eller registrera med</Text>
        <View className="flex-1 h-px bg-gray-600" />
      </View>

      {/* Social */}
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

export default RegisterForm;
