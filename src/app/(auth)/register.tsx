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
    <View className="space-y-4">
      <TextInput
        className="rounded-lg border border-gray-300 p-3"
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        editable={!isSubmitting}
      />
      <TextInput
        className="rounded-lg border border-gray-300 p-3"
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        editable={!isSubmitting}
      />
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
        className={`rounded-lg ${
          isSubmitting ? "bg-blue-400" : "bg-blue-500"
        } p-3`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-center text-white font-semibold">
          {isSubmitting ? "Registering..." : "Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterForm;
