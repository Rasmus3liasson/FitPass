import { AddressInput } from "@/src/components/AddressInput";
import { AddressInfo } from "@/src/services/googlePlacesService";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";

interface FieldErrors {
  [key: string]: string | undefined;
}

interface RegisterFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
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
  confirmPassword,
  setConfirmPassword,
  phone,
  setPhone,
  address,
  latitude,
  longitude,
  onAddressSelect,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      // You might want to show an error message here
      return;
    }
    onSubmit();
  };

  return (
    <View className="space-y-6">
      <View className="flex-row space-x-4">
        <View className="flex-1">
          <Text className="text-white font-semibold mb-2 text-lg">
            First Name
          </Text>
          <TextInput
            className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
              fieldErrors.firstName ? "border-red-500" : "border-gray-600"
            }`}
            placeholder="First name"
            placeholderTextColor={colors.borderGray}
            value={firstName}
            onChangeText={setFirstName}
            editable={!isSubmitting}
          />
          {fieldErrors.firstName && (
            <Text className="text-red-400 text-sm mt-1">
              {fieldErrors.firstName}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold mb-2 text-lg">
            Last Name
          </Text>
          <TextInput
            className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
              fieldErrors.lastName ? "border-red-500" : "border-gray-600"
            }`}
            placeholder="Last name"
            placeholderTextColor={colors.borderGray}
            value={lastName}
            onChangeText={setLastName}
            editable={!isSubmitting}
          />
          {fieldErrors.lastName && (
            <Text className="text-red-400 text-sm mt-1">
              {fieldErrors.lastName}
            </Text>
          )}
        </View>
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Email</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
            fieldErrors.email ? "border-red-500" : "border-gray-600"
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

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Phone</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
            fieldErrors.phone ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.borderGray}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isSubmitting}
        />
        {fieldErrors.phone && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.phone}</Text>
        )}
      </View>

      {/* Address */}
      <AddressInput
        label="Address"
        placeholder="Enter your home address"
        currentAddress={address}
        onAddressSelect={onAddressSelect}
        error={fieldErrors.address}
      />

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Password</Text>
        <View className="relative">
          <TextInput
            className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg pr-12 border ${
              fieldErrors.password ? "border-red-500" : "border-gray-600"
            }`}
            placeholder="Create a password"
            placeholderTextColor={colors.borderGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            className="absolute right-4 top-4"
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={24} color={colors.borderGray} />
            ) : (
              <Eye size={24} color={colors.borderGray} />
            )}
          </TouchableOpacity>
        </View>
        {fieldErrors.password && (
          <Text className="text-red-400 text-sm mt-1">
            {fieldErrors.password}
          </Text>
        )}
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">
          Confirm Password
        </Text>
        <View className="relative">
          <TextInput
            className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg pr-12 border ${
              fieldErrors.confirmPassword ? "border-red-500" : "border-gray-600"
            }`}
            placeholder="Confirm your password"
            placeholderTextColor={colors.borderGray}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            className="absolute right-4 top-4"
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={24} color={colors.borderGray} />
            ) : (
              <Eye size={24} color={colors.borderGray} />
            )}
          </TouchableOpacity>
        </View>
        {fieldErrors.confirmPassword && (
          <Text className="text-red-400 text-sm mt-1">
            {fieldErrors.confirmPassword}
          </Text>
        )}
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-5 ${
          isSubmitting ? "bg-indigo-400" : "bg-indigo-500"
        }`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text className="text-white font-bold text-lg">
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>

      <Text className="text-gray-400 text-center text-sm mt-4">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy
      </Text>
    </View>
  );
};

export default RegisterForm;
