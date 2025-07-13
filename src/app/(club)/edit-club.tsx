import AmenitiesSelector from "@/components/AmenitiesSelector";
import ImagePicker from "@/components/ImagePicker";
import OpenHoursInput from "@/components/OpenHoursInput";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubByUserId, useUpdateClub } from "@/src/hooks/useClubs";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

export default function EditClubScreen() {
  const { user, signOut } = useAuth();
  const { data: club, isLoading } = useClubByUserId(user?.id || "");

  const updateClub = useUpdateClub(); // You may need to implement this
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
    if (!club) {
      Alert.alert("Error", "Club data not loaded");
      return;
    }
    try {
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
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not update club info",
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

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background px-4">
        <Text className="text-white text-2xl font-bold m-6 text-center">
          Edit Club Information
        </Text>
        {Object.entries(form).map(([key, value]) => {
          if (typeof value !== "string") return null;
          return (
            <View key={key} className="mb-4">
              <Text className="text-white font-semibold mb-1 capitalize">
                {key.replace(/_/g, " ")}
              </Text>
              <TextInput
                className="bg-surface text-white rounded-lg px-4 py-3 border border-borderGray"
                value={value}
                onChangeText={(text) => handleChange(key, text)}
                placeholder={key}
                placeholderTextColor="#A0A0A0"
                multiline={key === "description"}
              />
            </View>
          );
        })}
        <OpenHoursInput
          value={form.open_hours}
          onChange={(val) => handleChange("open_hours", val)}
        />
        <AmenitiesSelector
          value={form.amenities}
          onChange={(val) => handleChange("amenities", val)}
        />
        <ImagePicker
          value={form.photos}
          onChange={(val) => handleChange("photos", val)}
        />
        <Button title="Save" onPress={handleSave} />
        {/* Sign Out Button */}
        
        
        
      </ScrollView>
    </SafeAreaWrapper>
  );
}
