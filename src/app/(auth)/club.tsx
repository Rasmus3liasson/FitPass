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
    <View className="space-y-8">
      <View>
        <Text className="text-textPrimary font-semibold mb-3 text-lg">
          Club Email
        </Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.email ? "border-accentRed" : "border-accentGray"
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
          <Text className="text-accentRed text-sm mt-1">{fieldErrors.email}</Text>
        )}
      </View>

      <View>
        <Text className="text-textPrimary font-semibold mb-3 text-lg">Password</Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.password ? "border-accentRed" : "border-borderGray"
          }`}
          placeholder="••••••••"
          placeholderTextColor={colors.borderGray}
          value={clubPassword}
          onChangeText={setClubPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
        {fieldErrors.password && (
          <Text className="text-accentRed text-sm mt-1">
            {fieldErrors.password}
          </Text>
        )}
      </View>

      <View>
        <Text className="text-textPrimary font-semibold mb-3 text-lg">
          Organization Number (Optional)
        </Text>
        <TextInput
          className={`bg-accentGray rounded-xl px-4 py-4 text-textPrimary text-lg border ${
            fieldErrors.orgNumber ? "border-accentRed" : "border-accentGray"
          }`}
          placeholder="XXXXXX-XXXX"
          placeholderTextColor={colors.borderGray}
          value={orgNumber}
          onChangeText={setOrgNumber}
          editable={!isSubmitting}
        />
        {fieldErrors.orgNumber && (
          <Text className="text-accentRed text-sm mt-1">
            {fieldErrors.orgNumber}
          </Text>
        )}
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center shadow-lg mt-5 ${
          isSubmitting ? "bg-accentPurple" : "bg-primary"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text className="text-textPrimary font-bold text-lg">Sign In as Club</Text>
        )}
      </TouchableOpacity>

      <Text className="text-textSecondary text-center text-sm mt-4">
        To create a club account, contact the {process.env.APP_NAME} administrator.
      </Text>
    </View>
  );
};

export default ClubLoginForm;
