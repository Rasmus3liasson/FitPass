import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface RegisterFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
}

const RegisterForm = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  isSubmitting,
  onSubmit,
}: RegisterFormProps) => {
  return (
    <View className="space-y-6">
      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-white font-semibold mb-2 text-lg">First Name</Text>
          <TextInput
            className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
            placeholder="First name"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isSubmitting}
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold mb-2 text-lg">Last Name</Text>
          <TextInput
            className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
            placeholder="Last name"
            placeholderTextColor="#9CA3AF"
            value={lastName}
            onChangeText={setLastName}
            editable={!isSubmitting}
          />
        </View>
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Email</Text>
        <TextInput
          className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
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
          className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="Create a password"
          placeholderTextColor="#9CA3AF"
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
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <Text className="text-gray-400 text-center text-sm mt-4">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};

export default RegisterForm;