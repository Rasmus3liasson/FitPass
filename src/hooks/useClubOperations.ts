import { useAuth } from "@/src/hooks/useAuth";
import { useCreateClub, useUpdateClub } from "@/src/hooks/useClubs";
import { useHasRole } from "@/src/hooks/useUserRole";
import { Club } from "@/src/types";
import { processFormImages } from "@/src/utils/formImageHelpers";
import { useState } from "react";
import { useGlobalFeedback } from './useGlobalFeedback';

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
  const { showError, showSuccess } = useGlobalFeedback();

  const validateUserPermissions = (): boolean => {
    if (!user) {
      showError(
        "Autentisering Fel",
        "Vänligen logga in för att skapa en klubb"
      );
      return false;
    }

    if (isLoadingRole) {
      showError(
        "Laddar",
        "Kontrollerar användarbehörigheter..."
      );
      return false;
    }

    if (!hasClubRole) {
      showError(
        "Behörighetsfel",
        "Klubbroll krävs för att skapa klubbar."
      );
      return false;
    }

    return true;
  };

  const validateFormData = (form: ClubFormData): boolean => {
    if (!form.name.trim()) {
      showError(
        "Kunde inte valideras",
        "Klubbnamn är obligatoriskt"
      );
      return false;
    }

    if (!form.type.trim()) {
      showError(
        "Kunde inte valideras",
        "Klubbtyp är obligatorisk"
      );
      return false;
    }

    if (
      !form.credits ||
      isNaN(Number(form.credits)) ||
      Number(form.credits) < 1
    ) {
      showError(
        "Kunde inte valideras",
        "Credits måste vara ett giltigt nummer (1 eller mer)"
      );
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
        `clubs/${existingClub?.id || 'new'}`,
        showError
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

        showSuccess(
          "Klubb Uppdaterad",
          "Din klubbinformation har sparats!"
        );
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

        showSuccess(
          "Klubb Skapad",
          "Din klubb har skapats framgångsrikt!"
        );
      }

      return true;
    } catch (error: any) {
      let errorMessage = "Could not create club";

      if (error?.code === "42501") {
        errorMessage =
          "Behörighet nekad: Ditt konto kanske inte har behörighet att skapa klubbar";
      } else if (error?.code === "PGRST204") {
        errorMessage = "Databas schemafel: Saknad obligatorisk kolumn";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showError(
        "Fel vid skapande av klubb",
        errorMessage
      );

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
