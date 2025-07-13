import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";
import { useClubByUserId, useUpdateClub } from "@/src/hooks/useClubs";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const dayLabels: { [key: string]: string } = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('sv-SE', { hour: "2-digit", minute: "2-digit", hour12: false });
}

function parseTime(str: string) {
  const [h, m] = str.split(":");
  const d = new Date();
  d.setHours(Number(h));
  d.setMinutes(Number(m));
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

function TimeRow({ day, open, close, onOpenPress, onClosePress }: {
  day: string;
  open: string;
  close: string;
  onOpenPress: () => void;
  onClosePress: () => void;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      <Text className="w-24 text-white">{dayLabels[day]}</Text>
      <TouchableOpacity
        className="bg-surface rounded-lg flex-1 py-3 mr-2 border border-borderGray items-center"
        onPress={onOpenPress}
      >
        <Text className="text-white text-lg text-center">{open}</Text>
      </TouchableOpacity>
      <Text className="text-white mx-1">-</Text>
      <TouchableOpacity
        className="bg-surface rounded-lg flex-1 py-3 border border-borderGray items-center"
        onPress={onClosePress}
      >
        <Text className="text-white text-lg text-center">{close}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function EditOpenHoursScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { data: club } = useClubByUserId(user?.id || "");
  const updateClub = useUpdateClub();
  const initial = params.open_hours ? JSON.parse(params.open_hours as string) : {};
  const [openHours, setOpenHours] = useState(initial);
  const [modal, setModal] = useState<{ day: string; which: "open" | "close" } | null>(null);
  const [tempTime, setTempTime] = useState("08:00");
  const [showPicker, setShowPicker] = useState(false);

  const handleTimeChange = (day: string, which: "open" | "close", time: string) => {
    const [open, close] = (openHours[day] || "08:00-20:00").split("-");
    setOpenHours({
      ...openHours,
      [day]: which === "open" ? `${time}-${close}` : `${open}-${time}`,
    });
  };

  const showTimePicker = (day: string, which: "open" | "close") => {
    setTempTime((openHours[day] || "08:00-20:00").split("-")[which === "open" ? 0 : 1]);
    setModal({ day, which });
    setShowPicker(true);
  };

  const saveTime = () => {
    if (modal) {
      handleTimeChange(modal.day, modal.which, tempTime);
      setModal(null);
      setShowPicker(false);
    }
  };

  const handleSave = async () => {
    console.log("handleSave called, club:", club);
    if (!club) return;
    try {
      console.log("Updating club open_hours:", club.id, openHours);
      await updateClub.mutateAsync({
        clubId: club.id,
        clubData: { open_hours: openHours }, // Only update open_hours
      });
      Toast.show({
        type: "success",
        text1: "Öppettider uppdaterade!",
        position: "bottom",
      });
      router.back();
    } catch (error) {
      console.error("Failed to update club open_hours:", error);
      Toast.show({
        type: "error",
        text1: "Fel",
        text2: "Kunde inte spara öppettider",
        position: "bottom",
      });
    }
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-bold my-6 text-center">Edit Opening Hours</Text>
        {days.map((day) => {
          const [open, close] = (openHours[day] || "08:00-20:00").split("-");
          return (
            <TimeRow
              key={day}
              day={day}
              open={open}
              close={close}
              onOpenPress={() => showTimePicker(day, "open")}
              onClosePress={() => showTimePicker(day, "close")}
            />
          );
        })}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mt-8 mb-8"
          onPress={handleSave}
        >
          <Text className="text-white text-lg font-semibold">Save</Text>
        </TouchableOpacity>
        {/* Modal for time picker */}
        <Modal visible={!!modal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: "#222", borderRadius: 16, padding: 24, width: 280 }}>
              <Text className="text-white text-lg mb-4">Set Time</Text>
              {Platform.OS === "web" ? (
                <TextInput
                  className="bg-surface rounded-lg px-4 py-3 mb-4 border border-borderGray text-white text-center"
                  value={tempTime}
                  onChangeText={setTempTime}
                  placeholder="08:00"
                />
              ) : (
                showPicker && (
                  <DateTimePicker
                    value={parseTime(tempTime)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event: DateTimePickerEvent, date?: Date | undefined) => {
                      if (date) {
                        setTempTime(formatTime(date));
                      }
                    }}
                    style={{ backgroundColor: "#222", marginBottom: 16 }}
                  />
                )
              )}
              <View className="flex-row justify-between mt-4">
                <TouchableOpacity onPress={() => { setModal(null); setShowPicker(false); }}>
                  <Text className="text-primary text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveTime}>
                  <Text className="text-primary text-base">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaWrapper>
  );
} 