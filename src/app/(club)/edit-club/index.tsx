import AmenitiesSelector from "@/components/AmenitiesSelector";
import ImagePicker from "@/components/ImagePicker";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { BackButton } from "@/src/components/Button";
import SignOutButton from "@/src/components/SignOutButton";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubByUserId, useCreateClub, useUpdateClub } from "@/src/hooks/useClubs";
import { useHasRole } from "@/src/hooks/useUserRole";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePickerLib from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Building2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Settings
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const { hasRole: hasClubRole, userRole, isLoading: isLoadingRole, error: roleError } = useHasRole(user?.id, 'club');
  const router = useRouter();

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
    credits: "1", // Default to 1 credit
    photos: [] as string[],
  });

  const [isUpdating, setIsUpdating] = useState(false);

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
        org_number: (club as any).org_number || "",
        credits: club.credits ? String(club.credits) : "",
        photos: club.photos || [],
      });
    }
  }, [club]);

  // Listen for updated opening hours when returning from opening hours screen
  useFocusEffect(
    React.useCallback(() => {
      const checkForTempOpeningHours = async () => {
        try {
          const tempHours = await AsyncStorage.getItem('temp_opening_hours');
          if (tempHours) {
            const parsedHours = JSON.parse(tempHours);
            setForm(prev => ({ ...prev, open_hours: parsedHours }));
            // Clear the temporary data
            await AsyncStorage.removeItem('temp_opening_hours');
          }
        } catch (error) {
          console.error("Error checking for temporary opening hours:", error);
        }
      };
      checkForTempOpeningHours();
    }, [])
  );

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    console.log("🚀 Starting handleSave...");
    console.log("Form data:", form);
    
    if (!user) {
      console.log("❌ No user found");
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Please log in to create a club",
        position: "top",
      });
      return;
    }
    
    console.log("✅ User found:", user.id);
    
    // Check if user profile has club role (do this first before any other validation)
    if (isLoadingRole) {
      console.log("⏳ Role still loading...");
      Toast.show({
        type: "error",
        text1: "Loading",
        text2: "Checking user permissions...",
        position: "top",
      });
      return;
    }
    
    console.log("✅ Role loaded. hasClubRole:", hasClubRole, "userRole:", userRole);
    
    if (!hasClubRole) {
      console.log("❌ User doesn't have club role");
      Toast.show({
        type: "error",
        text1: "Permission Error",
        text2: "Club role is required to create clubs.",
        position: "top",
      });
      return;
    }
    
    console.log("✅ User has club role");
    
    // Basic validation
    if (!form.name.trim()) {
      console.log("❌ Club name validation failed. Name:", form.name);
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Club name is required",
        position: "top",
      });
      return;
    }

    console.log("✅ Club name valid:", form.name);

    if (!form.type.trim()) {
      console.log("❌ Club type validation failed. Type:", form.type);
      Toast.show({
        type: "error", 
        text1: "Validation Error",
        text2: "Club type is required",
        position: "top",
      });
      return;
    }

    console.log("✅ Club type valid:", form.type);

    if (!form.credits || isNaN(Number(form.credits)) || Number(form.credits) < 1) {
      console.log("❌ Credits validation failed. Credits:", form.credits, "Number(credits):", Number(form.credits));
      Toast.show({
        type: "error",
        text1: "Validation Error", 
        text2: "Credits must be a valid number (1 or more)",
        position: "top",
      });
      return;
    }

    console.log("✅ Credits valid:", form.credits);
    console.log("🎯 All validations passed, proceeding with club creation/update");

    setIsUpdating(true);
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
          text1: "✅ Club Updated",
          text2: "Your club information has been saved successfully!",
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        const clubData = {
          ...form,
          user_id: user.id,
          avatar_url: form.photos[0] || null,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          credits: form.credits ? Number(form.credits) : 1,
        };
        
        await createClub.mutateAsync(clubData);
        
        Toast.show({
          type: "success",
          text1: "🎉 Club Created",
          text2: "Your club has been created successfully!",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      let errorMessage = "Could not create club";
      
      if (error?.code === "42501") {
        errorMessage = "Permission denied: Your account may not have club creation privileges";
      } else if (error?.code === "PGRST204") {
        errorMessage = "Database schema error: Missing required column";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Toast.show({
        type: "error",
        text1: "❌ Error",
        text2: errorMessage,
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for updating avatar (first photo)
  const handleAvatarChange = async () => {
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

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-white mt-4 text-base">Loading club information...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const CreditsEnum = [1, 2, 3];

  // Helper function to format opening hours for display (like facility screen)
  const formatOpeningHours = (openHours: { [key: string]: string }) => {
    const hasHours = Object.keys(openHours).length > 0;
    if (!hasHours) return "Not set";

    const days = [
      "monday",
      "tuesday", 
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayLabels = [
      "Mon",
      "Tue",
      "Wed", 
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ];

    const result = [];
    let rangeStart = 0;

    while (rangeStart < days.length) {
      const currentHours = openHours[days[rangeStart]] || "Closed";
      let rangeEnd = rangeStart;

      // Find the end of the range with the same hours
      while (
        rangeEnd + 1 < days.length &&
        (openHours[days[rangeEnd + 1]] || "Closed") === currentHours
      ) {
        rangeEnd++;
      }

      // Format the day label
      const dayRange =
        rangeStart === rangeEnd
          ? dayLabels[rangeStart]
          : `${dayLabels[rangeStart]}–${dayLabels[rangeEnd]}`;

      result.push(`${dayRange}: ${currentHours}`);
      rangeStart = rangeEnd + 1;
    }

    return result.join("\n");
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 py-4">
          <BackButton />
        </View>

        {/* Club Profile Section */}
        <Section 
          title={club ? "Edit Club Profile" : "Create Your Club"}
          description={club ? "Update your club information and settings" : "Set up your club profile to get started"}
        >
          {/* Club Avatar */}
          <View className="items-center mb-6">
            <TouchableOpacity
              className="mb-2"
              activeOpacity={0.7}
              onPress={handleAvatarChange}
            >
              {form.photos[0] ? (
                <Image
                  source={{ uri: form.photos[0] }}
                  style={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: 60,
                    borderWidth: 4,
                    borderColor: "#6366F1"
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#374151",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 4,
                    borderColor: "#6366F1",
                  }}
                >
                  <Text className="text-white text-4xl font-bold">
                    {form.name?.[0]?.toUpperCase() || "C"}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-primary p-3 rounded-full">
                <ImageIcon size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-textSecondary text-sm text-center mt-2">
              Tap to change club photo
            </Text>
          </View>

          {/* Basic Information Card */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Building2 size={16} color="#6366F1" />
              </View>
              <Text className="text-white text-lg font-semibold">Basic Information</Text>
            </View>
            
            {/* Club Name */}
            <View className="mb-4">
              <Text className="text-white mb-2 font-medium">Club Name *</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                placeholder="Enter your club name"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
              />
            </View>

            {/* Club Type */}
            <View className="mb-4">
              <Text className="text-white mb-2 font-medium">Club Type *</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                placeholder="e.g., Gym, Fitness Center, Yoga Studio"
                placeholderTextColor="#9CA3AF"
                value={form.type}
                onChangeText={(text) => handleChange("type", text)}
              />
            </View>

            {/* Description */}
            <View>
              <Text className="text-white mb-2 font-medium">Description</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                placeholder="Tell people about your club..."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(text) => handleChange("description", text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </Section>

        {/* Location Section */}
        <Section 
          title="Location & Contact"
          description="Help members find and visit your club"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <MapPin size={16} color="#6366F1" />
              </View>
              <Text className="text-white text-lg font-semibold">Address Information</Text>
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-white mb-2 font-medium">Street Address</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                placeholder="Enter street address"
                placeholderTextColor="#9CA3AF"
                value={form.address}
                onChangeText={(text) => handleChange("address", text)}
              />
            </View>

            {/* City and Area */}
            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-white mb-2 font-medium">City</Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={form.city}
                  onChangeText={(text) => handleChange("city", text)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-white mb-2 font-medium">Area/District</Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                  placeholder="Area"
                  placeholderTextColor="#9CA3AF"
                  value={form.area}
                  onChangeText={(text) => handleChange("area", text)}
                />
              </View>
            </View>

            {/* Coordinates */}
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <Text className="text-white mb-2 font-medium">Latitude</Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                  placeholder="59.3293"
                  placeholderTextColor="#9CA3AF"
                  value={form.latitude}
                  onChangeText={(text) => handleChange("latitude", text.replace(/[^0-9.\-]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white mb-2 font-medium">Longitude</Text>
                <TextInput
                  className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                  placeholder="18.0686"
                  placeholderTextColor="#9CA3AF"
                  value={form.longitude}
                  onChangeText={(text) => handleChange("longitude", text.replace(/[^0-9.\-]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </Section>

        {/* Business Information */}
        <Section 
          title="Business Information"
          description="Organization details and pricing"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Settings size={16} color="#6366F1" />
              </View>
              <Text className="text-white text-lg font-semibold">Business Details</Text>
            </View>

            {/* Organization Number */}
            <View className="mb-4">
              <Text className="text-white mb-2 font-medium">Organization Number</Text>
              <TextInput
                className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
                placeholder="123456-7890"
                placeholderTextColor="#9CA3AF"
                value={form.org_number}
                onChangeText={(text) => handleChange("org_number", text.replace(/[^0-9\-]/g, ''))}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>

            {/* Credits */}
            <View>
              <Text className="text-white mb-3 font-medium">Credits Required per Visit</Text>
              <View className="flex-row space-x-3">
                {CreditsEnum.map((val) => (
                  <TouchableOpacity
                    key={val}
                    className={`flex-1 py-4 rounded-xl border-2 ${
                      form.credits == String(val) 
                        ? "bg-primary border-primary" 
                        : "bg-background border-gray-600"
                    }`}
                    onPress={() => handleChange("credits", String(val))}
                  >
                    <View className="items-center">
                      <CreditCard 
                        size={20} 
                        color={form.credits == String(val) ? "white" : "#6366F1"} 
                      />
                      <Text className={`text-lg font-semibold mt-1 ${
                        form.credits == String(val) ? "text-white" : "text-textSecondary"
                      }`}>
                        {val}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Section>



        {/* Operating Hours */}
        <Section 
          title="Operating Hours"
          description="Set when your club is open to members"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Clock size={16} color="#6366F1" />
              </View>
              <Text className="text-white text-lg font-semibold">Current Hours</Text>
            </View>

            {/* Display current hours */}
            <View className="mb-4 p-3 bg-background rounded-xl border border-gray-600">
              <Text className="text-textSecondary text-sm mb-2">Opening Hours</Text>
              <Text className="text-white text-base leading-6">
                {formatOpeningHours(form.open_hours)}
              </Text>
              {/* Debug info - remove in production */}
              <Text className="text-textSecondary text-xs mt-2">
                {Object.keys(form.open_hours).length} days configured
              </Text>
            </View>

            {/* Edit button - always available */}
            <TouchableOpacity
              className="bg-primary/10 border-2 border-primary/30 rounded-xl py-3 items-center"
              onPress={() => 
                router.push({
                  pathname: ROUTES.EDIT_CLUB_OPEN_HOURS,
                  params: { 
                    open_hours: JSON.stringify(form.open_hours),
                    club_exists: club ? "true" : "false"
                  },
                } as any)
              }
            >
              <View className="flex-row items-center">
                <Clock size={16} color="#6366F1" />
                <Text className="text-primary text-base font-semibold ml-2">
                  {club ? "Edit Opening Hours" : "Set Opening Hours"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Amenities */}
        <Section 
          title="Amenities & Features"
          description="Let members know what facilities you offer"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <AmenitiesSelector />
          </View>
        </Section>

        {/* Club Images */}
        <Section 
          title="Club Photos"
          description="Showcase your facilities with high-quality images"
        >
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <ImagePicker
              value={form.photos}
              onChange={(val) => handleChange("photos", val)}
              fullWidth
            />
          </View>
        </Section>

        {/* Save Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center shadow-lg"
            onPress={handleSave}
            disabled={isUpdating}
            style={{
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {isUpdating ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white text-lg font-semibold ml-2">
                  {club ? "Updating..." : "Creating..."}
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-semibold">
                {club ? "Save Changes" : "Create Club"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="px-6">
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
