import AmenitiesSelector from "@/components/AmenitiesSelector";
import ImagePicker from "@/components/ImagePicker";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { BackButton } from "@/src/components/Button";
import SignOutButton from "@/src/components/SignOutButton";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubByUserId, useCreateClub, useUpdateClub } from "@/src/hooks/useClubs";
import * as ImagePickerLib from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function EditClubScreen() {
  const { user, signOut } = useAuth();
  const { data: club, isLoading } = useClubByUserId(user?.id || "");

  const updateClub = useUpdateClub();
  const createClub = useCreateClub();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    area: "",
    type: "",
    image_url: "",
    open_hours: {},
    amenities: [] as string[],
    latitude: "",
    longitude: "",
    org_number: "",
    credits: "",
    photos: [] as string[],
  });

  useEffect(() => {
    if (club) {
      setForm({
        name: club.name || "",
        description: club.description || "",
        address: club.address || "",
        city: club.city || "",
        area: club.area || "",
        type: club.type || "",
        image_url: club.image_url || "",
        open_hours: club.open_hours || {},
        amenities: club.amenities || [],
        latitude: club.latitude ? String(club.latitude) : "",
        longitude: club.longitude ? String(club.longitude) : "",
        org_number: (club as any).org_number || "", // fallback for missing type
        credits: club.credits ? String(club.credits) : "",
        photos: club.photos || [],
      });
    }
  }, [club]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      if (club) {
        await updateClub.mutateAsync({
          clubId: club.id,
          clubData: {
            ...form,
            open_hours: form.open_hours,
            amenities: form.amenities,
            latitude: form.latitude ? Number(form.latitude) : undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined,
            credits: form.credits ? Number(form.credits) : undefined,
            photos: form.photos,
          },
        });
        Toast.show({
          type: "success",
          text1: "Saved",
          text2: "Club information updated!",
          position: "bottom",
        });
      } else {
        await createClub.mutateAsync({
          ...form,
          user_id: user.id,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          credits: form.credits ? Number(form.credits) : undefined,
        });
        Toast.show({
          type: "success",
          text1: "Created",
          text2: "Club created!",
          position: "bottom",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: club ? "Could not update club info" : "Could not create club",
        position: "bottom",
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <Text className="text-white">Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Helper for updating avatar (first photo)
  const handleAvatarChange = async () => {
    // Use ImagePickerLib directly for single image
    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setForm((prev) => ({ ...prev, photos: [uri, ...prev.photos.slice(1)] }));
    }
  };

  const router = useRouter();

  // Credits enum
  const CreditsEnum = [1, 2, 3];

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
        {/* Club Avatar */}
        <View className="mb-6 items-center">
          <TouchableOpacity
            className="mb-2"
            activeOpacity={0.7}
            onPress={handleAvatarChange}
          >
            {form.photos[0] ? (
              <Image
                source={{ uri: form.photos[0] }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "#22223b",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-white text-3xl font-bold">
                  {form.name?.[0] || "C"}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
              <Text className="text-white text-xs font-semibold">Edit</Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* Club Info Fields */}
        <View className="mb-6">
          <Text className="text-white mb-2">Club Name</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Club name"
            placeholderTextColor="#999999"
            value={form.name}
            onChangeText={(text) => handleChange("name", text)}
          />
        </View>
        <View className="mb-6">
          <Text className="text-white mb-2">Description</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Description"
            placeholderTextColor="#999999"
            value={form.description}
            onChangeText={(text) => handleChange("description", text)}
            multiline
          />
        </View>
        <View className="mb-6 flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-white mb-2">City</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="City"
              placeholderTextColor="#999999"
              value={form.city}
              onChangeText={(text) => handleChange("city", text)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white mb-2">Area</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="Area"
              placeholderTextColor="#999999"
              value={form.area}
              onChangeText={(text) => handleChange("area", text)}
            />
          </View>
        </View>
        <View className="mb-6 flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-white mb-2">Address</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="Address"
              placeholderTextColor="#999999"
              value={form.address}
              onChangeText={(text) => handleChange("address", text)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white mb-2">Org Number</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="123456-7890"
              placeholderTextColor="#999999"
              value={form.org_number}
              onChangeText={(text) => handleChange("org_number", text.replace(/[^0-9\\-]/g, ''))}
              keyboardType="number-pad"
              maxLength={11}
            />
          </View>
        </View>
        <View className="mb-6">
          <Text className="text-white mb-2">Type</Text>
          <TextInput
            className="bg-surface rounded-lg px-4 py-3 text-white"
            placeholder="Type"
            placeholderTextColor="#999999"
            value={form.type}
            onChangeText={(text) => handleChange("type", text)}
          />
        </View>
        {/* Credits */}
        <View className="mb-6">
          <Text className="text-white mb-2">Credits</Text>
          <View className="flex-row space-x-4">
            {CreditsEnum.map((val) => (
              <TouchableOpacity
                key={val}
                className={`flex-1 py-4 rounded-xl border ${form.credits == String(val) ? "bg-primary border-primary" : "bg-surface border-borderGray"}`}
                onPress={() => handleChange("credits", String(val))}
              >
                <Text className={`text-lg text-center ${form.credits == String(val) ? "text-white" : "text-textSecondary"}`}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View className="mb-6 flex-row space-x-4">
          <View className="flex-1">
            <Text className="text-white mb-2">Latitude</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="59.3293"
              placeholderTextColor="#999999"
              value={form.latitude}
              onChangeText={(text) => handleChange("latitude", text.replace(/[^0-9.\\-]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white mb-2">Longitude</Text>
            <TextInput
              className="bg-surface rounded-lg px-4 py-3 text-white"
              placeholder="18.0686"
              placeholderTextColor="#999999"
              value={form.longitude}
              onChangeText={(text) => handleChange("longitude", text.replace(/[^0-9.\\-]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
        </View>
        {/* Open Hours */}
        <View className="mb-6">
          <TouchableOpacity
            className="bg-surface rounded-xl py-3 items-center border border-borderGray"
            onPress={() =>
              router.push({
                pathname: ROUTES.EDIT_CLUB_OPEN_HOURS,
                params: { open_hours: JSON.stringify(form.open_hours) },
              })
            }
          >
            <Text className="text-white text-base font-semibold">
              Edit Opening Hours
            </Text>
          </TouchableOpacity>
        </View>
        {/* Amenities */}
        <View className="mb-6">
          <AmenitiesSelector />
        </View>
        {/* Club Images */}
        <View className="mb-6">
          <ImagePicker
            value={form.photos}
            onChange={(val) => handleChange("photos", val)}
            fullWidth
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-8"
          onPress={handleSave}
        >
          <Text className="text-white text-lg font-semibold">Save Changes</Text>
        </TouchableOpacity>
        <SignOutButton />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
