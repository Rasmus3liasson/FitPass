import { Club } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
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

const initialFormState: ClubFormData = {
  name: "",
  description: "",
  address: "",
  city: "",
  area: "",
  type: "",
  image_url: "",
  open_hours: {},
  amenities: [],
  latitude: "",
  longitude: "",
  org_number: "",
  credits: "1",
  photos: [],
};

export const useClubForm = (club?: Club) => {
  const [form, setForm] = useState<ClubFormData>(initialFormState);

  // Update form when club data is loaded
  const updateFormFromClub = useCallback((clubData: Club) => {
    setForm({
      name: clubData.name || "",
      description: clubData.description || "",
      address: clubData.address || "",
      city: clubData.city || "",
      area: clubData.area || "",
      type: clubData.type || "",
      image_url: clubData.image_url || "",
      open_hours: clubData.open_hours || {},
      amenities: clubData.amenities || [],
      latitude: clubData.latitude ? String(clubData.latitude) : "",
      longitude: clubData.longitude ? String(clubData.longitude) : "",
      org_number: (clubData as any).org_number || "",
      credits: clubData.credits ? String(clubData.credits) : "1",
      photos: clubData.photos || [],
    });
  }, []);

  // Generic form field handler
  const handleChange = useCallback((key: keyof ClubFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Check for temporary opening hours from AsyncStorage
  const checkForTempOpeningHours = useCallback(async () => {
    try {
      const tempHours = await AsyncStorage.getItem('temp_opening_hours');
      if (tempHours) {
        const parsedHours = JSON.parse(tempHours);
        setForm(prev => ({ ...prev, open_hours: parsedHours }));
        await AsyncStorage.removeItem('temp_opening_hours');
      }
    } catch (error) {
      // Silently handle error - temporary hours are not critical
    }
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
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

    if (!form.credits || isNaN(Number(form.credits)) || Number(form.credits) < 1) {
      Toast.show({
        type: "error",
        text1: "Validation Error", 
        text2: "Credits must be a valid number (1 or more)",
        position: "top",
      });
      return false;
    }

    return true;
  }, [form]);

  // Prepare data for submission
  const prepareSubmissionData = useCallback((userId: string) => {
    return {
      ...form,
      user_id: userId,
      avatar_url: form.photos[0] || null,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      credits: form.credits ? Number(form.credits) : 1,
    };
  }, [form]);

  // Format opening hours for display
  const formatOpeningHours = useCallback((openHours: { [key: string]: string }) => {
    const hasHours = Object.keys(openHours).length > 0;
    if (!hasHours) return "Not set";

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const result = [];
    let rangeStart = 0;

    while (rangeStart < days.length) {
      const currentHours = openHours[days[rangeStart]] || "Closed";
      let rangeEnd = rangeStart;

      while (
        rangeEnd + 1 < days.length &&
        (openHours[days[rangeEnd + 1]] || "Closed") === currentHours
      ) {
        rangeEnd++;
      }

      const dayRange =
        rangeStart === rangeEnd
          ? dayLabels[rangeStart]
          : `${dayLabels[rangeStart]}–${dayLabels[rangeEnd]}`;

      result.push(`${dayRange}: ${currentHours}`);
      rangeStart = rangeEnd + 1;
    }

    return result.join("\n");
  }, []);

  return {
    form,
    handleChange,
    updateFormFromClub,
    checkForTempOpeningHours,
    validateForm,
    prepareSubmissionData,
    formatOpeningHours,
  };
};
