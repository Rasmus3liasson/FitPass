import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BackButton } from "../../../components/Button";
import { OpeningHoursModal } from "../../../components/OpeningHoursModal";

export default function EditOpenHoursScreen() {
  const router = useRouter();
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save opening hours
      console.log("Saving opening hours:", openingHours);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Sparad!", "Öppettider har uppdaterats", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Fel", "Kunde inte spara öppettider");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to display opening hours nicely
  const formatDisplayHours = (timeString: string) => {
    const [open, close] = timeString.split("-");
    return `${open} - ${close}`;
  };

  const dayLabels: Record<string, string> = {
    monday: "Måndag",
    tuesday: "Tisdag",
    wednesday: "Onsdag",
    thursday: "Torsdag",
    friday: "Fredag",
    saturday: "Lördag",
    sunday: "Söndag",
  };

  return (
    <View className="flex-1 bg-background">
      {/* Back Button */}
      <View className="px-4 pt-12 pb-4">
        <BackButton />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Title */}
        <Text className="text-textPrimary text-2xl font-bold mb-6">
          Öppettider
        </Text>

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
            {Object.entries(openingHours).map(([day, hours]) => (
              <View
                key={day}
                className="flex-row justify-between items-center py-2"
              >
                <Text className="text-textPrimary font-medium">
                  {dayLabels[day]}
                </Text>
                <Text className="text-textSecondary">
                  {formatDisplayHours(hours)}
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
