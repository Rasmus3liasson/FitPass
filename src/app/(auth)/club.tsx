import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../../constants/custom-colors";

interface FieldErrors {
  [key: string]: string | undefined;
}

interface ClubLoginFormProps {
  clubEmail: string;
  setClubEmail: (v: string) => void;
  clubPassword: string;
  setClubPassword: (v: string) => void;
  orgNumber: string;
  setOrgNumber: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void | Promise<void>;
  fieldErrors?: FieldErrors;
}

const ClubLoginForm = ({
  clubEmail,
  setClubEmail,
  clubPassword,
  setClubPassword,
  orgNumber,
  setOrgNumber,
  isSubmitting,
  onSubmit,
  fieldErrors = {},
}: ClubLoginFormProps) => {
  return (
    <View className="space-y-6">
      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Club Email</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="club@example.com"
          placeholderTextColor={colors.borderGray}
          value={clubEmail}
          onChangeText={setClubEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
        {fieldErrors.email && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.email}</Text>
        )}
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Password</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
            fieldErrors.password ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="••••••••"
          placeholderTextColor={colors.borderGray}
          value={clubPassword}
          onChangeText={setClubPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
        {fieldErrors.password && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.password}</Text>
        )}
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">
          Organization Number (Optional)
        </Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-white text-lg border ${
            fieldErrors.orgNumber ? 'border-red-500' : 'border-gray-600'
          }`}
          placeholder="XXXXXX-XXXX"
          placeholderTextColor={colors.borderGray}
          value={orgNumber}
          onChangeText={setOrgNumber}
          editable={!isSubmitting}
        />
        {fieldErrors.orgNumber && (
          <Text className="text-red-400 text-sm mt-1">{fieldErrors.orgNumber}</Text>
        )}
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-5 ${
          isSubmitting ? "bg-indigo-400" : "bg-indigo-500"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text className="text-white font-bold text-lg">
            Sign In as Club
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-gray-400 text-center text-sm mt-4">
        To create a club account, contact the FitPass administrator.
      </Text>
    </View>
  );
};

export default ClubLoginForm;