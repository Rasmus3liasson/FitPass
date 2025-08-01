import { useAuth } from "@/src/hooks/useAuth";
import { useCreateClub, useUpdateClub } from "@/src/hooks/useClubs";
import { useHasRole } from "@/src/hooks/useUserRole";
import { Club } from "@/src/types";
import { processFormImages } from "@/src/utils/formImageHelpers";
import { useState } from "react";
import Toast from "react-native-toast-message";

interface ClubFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  area: string;
  type: string;
  image_url: string;
  open_hours: { [key: string]: string };
  amenities: string[];
  latitude: string;
  longitude: string;
  org_number: string;
  credits: string;
  photos: string[];
}

export const useClubOperations = () => {
  const { user } = useAuth();
  const {
    hasRole: hasClubRole,
    userRole,
    isLoading: isLoadingRole,
  } = useHasRole(user?.id, "club");
  const updateClub = useUpdateClub();
  const createClub = useCreateClub();
  const [isUpdating, setIsUpdating] = useState(false);

  const validateUserPermissions = (): boolean => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Authentication Error",
        text2: "Please log in to create a club",
        position: "top",
      });
      return false;
    }

    if (isLoadingRole) {
      Toast.show({
        type: "error",
        text1: "Loading",
        text2: "Checking user permissions...",
        position: "top",
      });
      return false;
    }

    if (!hasClubRole) {
      Toast.show({
        type: "error",
        text1: "Permission Error",
        text2: "Club role is required to create clubs.",
        position: "top",
      });
      return false;
    }

    return true;
  };

  const validateFormData = (form: ClubFormData): boolean => {
    if (!form.name.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Club name is required",
        position: "top",
      });
      return false;
    }

    if (!form.type.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Club type is required",
        position: "top",
      });
      return false;
    }

    if (
      !form.credits ||
      isNaN(Number(form.credits)) ||
      Number(form.credits) < 1
    ) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Credits must be a valid number (1 or more)",
        position: "top",
      });
      return false;
    }

    return true;
  };

  const saveClub = async (
    form: ClubFormData,
    existingClub?: Club
  ): Promise<boolean> => {
    if (!validateUserPermissions() || !validateFormData(form)) {
      return false;
    }

    setIsUpdating(true);

    try {
      // Process images first - upload any local images to Supabase
      const processedPhotos = await processFormImages(
        form.photos, 
        'images', 
        `clubs/${existingClub?.id || 'new'}`
      );

      if (existingClub) {
        await updateClub.mutateAsync({
          clubId: existingClub.id,
          clubData: {
            ...form,
            open_hours: form.open_hours,
            amenities: form.amenities,
            latitude: form.latitude ? Number(form.latitude) : undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined,
            credits: form.credits ? Number(form.credits) : undefined,
          },
          images: processedPhotos.map((url, i) => ({
            url,
            type: i === 0 ? "poster" : "gallery",
          })),
        });

        Toast.show({
          type: "success",
          text1: "✅ Club Updated",
          text2: "Your club information has been saved successfully!",
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        // Create new club
        const clubData = {
          ...form,
          user_id: user!.id,
          avatar_url: processedPhotos[0] || null,
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

      return true;
    } catch (error: any) {
      let errorMessage = "Could not create club";

      if (error?.code === "42501") {
        errorMessage =
          "Permission denied: Your account may not have club creation privileges";
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

      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    saveClub,
    isUpdating,
    isLoadingRole,
  };
};
