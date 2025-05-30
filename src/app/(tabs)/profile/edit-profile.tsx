import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { BackButton } from "@/src/components/Button";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Avatar } from "react-native-elements";

export default function EditProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="py-4">
          <BackButton />
        </View>

        {/* Change Avatar */}
        <View className="mb-6 items-center">
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            className="w-24 h-24 rounded-full mb-2"
          />
          <TouchableOpacity className="mb-2" activeOpacity={0.7}>
            <Avatar
              source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
              size={96}
              rounded
            />
            <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
              <Text className="text-white text-xs font-semibold">Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* First Name */}
        <View className="mb-6">
          <Text className="text-white mb-2">First Name</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your first name"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Last Name */}
        <View className="mb-6">
          <Text className="text-white mb-2">Last Name</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your last name"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Email */}
        <View className="mb-6">
          <Text className="text-white mb-2">Email</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your email"
            placeholderTextColor="#999999"
            keyboardType="email-address"
          />
        </View>

        {/* Phone Number */}
        <View className="mb-6">
          <Text className="text-white mb-2">Phone Number</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Your phone number"
            placeholderTextColor="#999999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Change Password */}
        <View className="mb-6">
          <Text className="text-white mb-2">Change Password</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white mb-2"
            placeholder="Current password"
            placeholderTextColor="#999999"
            secureTextEntry
          />
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white mb-2"
            placeholder="New password"
            placeholderTextColor="#999999"
            secureTextEntry
          />
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Confirm new password"
            placeholderTextColor="#999999"
            secureTextEntry
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={() => {
            // Handle save here
            router.back();
          }}
        >
          <Text className="text-white text-lg font-semibold">Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
