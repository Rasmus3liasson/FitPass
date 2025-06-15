import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
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
  onSubmit: () => void | Promise<void>;
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
      Toast.show({ type: "error", text1: "Error", text2: formError });
    }
  }, [formError]);

  return (
    <View className="space-y-6">
      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Club Email</Text>
        <TextInput
          className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="club@example.com"
          placeholderTextColor="#9CA3AF"
          value={clubEmail}
          onChangeText={setClubEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">Password</Text>
        <TextInput
          className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          value={clubPassword}
          onChangeText={setClubPassword}
          secureTextEntry
          editable={!isSubmitting}
        />
      </View>

      <View>
        <Text className="text-white font-semibold mb-2 text-lg">
          Organization Number (Optional)
        </Text>
        <TextInput
          className="bg-[#2A2A3E] border border-gray-600 rounded-xl px-4 py-4 text-white text-lg"
          placeholder="XXXXXX-XXXX"
          placeholderTextColor="#9CA3AF"
          value={orgNumber}
          onChangeText={setOrgNumber}
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
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
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