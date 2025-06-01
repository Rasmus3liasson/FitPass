import React, { useEffect } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

interface ClubLoginFormProps {
  clubEmail: string;
  setClubEmail: (v: string) => void;
  clubPassword: string;
  setClubPassword: (v: string) => void;
  orgNumber: string;
  setOrgNumber: (v: string) => void;
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => void;

}

const ClubLoginForm = ({
  clubEmail,
  setClubEmail,
  clubPassword,
  setClubPassword,
  orgNumber,
  setOrgNumber,
  isSubmitting,
  formError,
  onSubmit,
}: ClubLoginFormProps) => {
  
  useEffect(() => {
    if (formError) {
      Toast.show({ type: "error", text1: "Fel", text2: formError });
    }
  }, [formError]);

  return (
    <View className="flex-1 bg-background p-4 justify-center">
      {/* Email */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-1 font-semibold">E-post</Text>
        <TextInput
          className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
          value={clubEmail}
          onChangeText={setClubEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
          placeholder="example@mail.com"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Password */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-1 font-semibold">Lösenord</Text>
        <TextInput
          className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
          value={clubPassword}
          onChangeText={setClubPassword}
          secureTextEntry
          editable={!isSubmitting}
          placeholder="••••••••"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Org Number */}
      <View className="mb-6">
        <Text className="text-textPrimary mb-1 font-semibold">Organisationsnummer (valfritt)</Text>
        <TextInput
          className="bg-surface border border-gray-600 rounded-md px-4 py-3 text-textPrimary"
          value={orgNumber}
          onChangeText={setOrgNumber}
          editable={!isSubmitting}
          placeholder="XXXXXX-XXXX"
          placeholderTextColor="#A0A0A0"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        className={`rounded-md py-3 mb-4 items-center ${
          isSubmitting ? "bg-primary/60" : "bg-primary"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-lg">Logga in som klubb</Text>
        )}
      </TouchableOpacity>

      <Text className="text-textSecondary text-sm">
        För att skapa ett klubbkonto, kontakta administratören för FlexClub.
      </Text>
    </View>
  );
};

export default ClubLoginForm;
