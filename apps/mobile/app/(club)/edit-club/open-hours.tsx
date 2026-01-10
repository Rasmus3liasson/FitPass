import AsyncStorage from "@react-native-async-storage/async-storage";
import { OpeningHoursModal } from "@shared/components/OpeningHoursModal";
import { PageHeader } from "@shared/components/PageHeader";
import { DAYS, DAY_LABELS } from "@shared/constants/days";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function EditOpenHoursScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess, showError } = useGlobalFeedback();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Default opening hours in the format expected by OpeningHoursModal
  const [openingHours, setOpeningHours] = useState<{ [key: string]: string }>({
    monday: "06:00-22:00",
    tuesday: "06:00-22:00",
    wednesday: "06:00-22:00",
    thursday: "06:00-22:00",
    friday: "06:00-22:00",
    saturday: "08:00-20:00",
    sunday: "08:00-20:00",
  });

  // Load opening hours from params when screen mounts
  useEffect(() => {
    if (params.open_hours && typeof params.open_hours === 'string') {
      try {
        const parsedHours = JSON.parse(params.open_hours);
        setOpeningHours(parsedHours);
      } catch (error) {
        console.error("Failed to parse opening hours:", error);
      }
    }
  }, [params.open_hours]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to AsyncStorage so the parent form can pick it up
      await AsyncStorage.setItem('temp_opening_hours', JSON.stringify(openingHours));

      showSuccess("Sparad!", "Öppettider har uppdaterats");
      router.back();
    } catch (error) {
      console.error("Error saving opening hours:", error);
      showError("Fel", "Kunde inte spara öppettider");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to display opening hours nicely
  const formatDisplayHours = (timeString: string) => {
    if (timeString === "Stängt" || timeString === "closed") {
      return "Stängt";
    }
    const [open, close] = timeString.split("-");
    return `${open} - ${close}`;
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Öppettider"
        subtitle="Hantera öppettider för din klubb"
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1 px-4">

        <View className="bg-surface rounded-xl p-4 shadow-sm border border-borderGray">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text className="text-textPrimary text-lg font-semibold">
                Öppettider
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-textPrimary font-medium">Redigera</Text>
            </TouchableOpacity>
          </View>

          {/* Display current hours */}
          <View className="space-y-3">
            {DAYS.map((day) => (
              <View
                key={day}
                className="flex-row justify-between items-center py-2"
              >
                <Text className="text-textPrimary font-medium">
                  {DAY_LABELS[day]}
                </Text>
                <Text className="text-textSecondary">
                  {formatDisplayHours(openingHours[day] || "08:00-20:00")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-surface rounded-xl p-4 shadow-sm border border-borderGray mt-4">
          <Text className="text-textPrimary text-lg font-semibold mb-3">
            Snabbåtgärder
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3 border-b border-borderGray"
            onPress={() => {
              setOpeningHours({
                monday: "06:00-22:00",
                tuesday: "06:00-22:00",
                wednesday: "06:00-22:00",
                thursday: "06:00-22:00",
                friday: "06:00-22:00",
                saturday: openingHours.saturday, // Keep weekend hours
                sunday: openingHours.sunday,
              });
            }}
          >
            <Text className="text-textPrimary">
              Sätt standard vardagar (06:00 - 22:00)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={() => {
              setOpeningHours({
                ...openingHours,
                saturday: "08:00-20:00",
                sunday: "08:00-20:00",
              });
            }}
          >
            <Text className="text-textPrimary">
              Sätt helger (08:00 - 20:00)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View className="mt-6 mb-6">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className={`flex-row items-center justify-center px-6 py-4 rounded-xl ${
              isLoading ? "bg-borderGray" : "bg-primary"
            }`}
          >
            <Text className="text-textPrimary font-semibold text-lg">
              {isLoading ? "Sparar..." : "Spara ändringar"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Opening Hours Modal */}
      <OpeningHoursModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        openHours={openingHours}
        onSave={(newHours) => {
          setOpeningHours(newHours);
          setShowModal(false);
        }}
      />
    </View>
  );
}
