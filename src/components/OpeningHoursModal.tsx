import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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
  return date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
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

function TimeRow({
  day,
  open,
  close,
  onOpenPress,
  onClosePress,
}: {
  day: string;
  open: string;
  close: string;
  onOpenPress: () => void;
  onClosePress: () => void;
}) {
  return (
    <View className="mb-4 p-3 bg-gray-700 rounded-xl border border-gray-600">
      <View className="flex-row items-center">
        <Text className="w-16 text-white font-semibold text-sm">
          {dayLabels[day]}
        </Text>
        <View className="flex-1 flex-row items-center">
          <TouchableOpacity
            className="bg-gray-600 rounded-lg flex-1 py-3 mr-3 border border-gray-500 items-center"
            onPress={onOpenPress}
            activeOpacity={0.7}
          >
            <Text className="text-white text-base font-medium">{open}</Text>
            <Text className="text-gray-400 text-xs mt-1">Opening</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 mx-2 font-bold">→</Text>
          <TouchableOpacity
            className="bg-gray-600 rounded-lg flex-1 py-3 border border-gray-500 items-center"
            onPress={onClosePress}
            activeOpacity={0.7}
          >
            <Text className="text-white text-base font-medium">{close}</Text>
            <Text className="text-gray-400 text-xs mt-1">Closing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface OpeningHoursModalProps {
  visible: boolean;
  onClose: () => void;
  openHours: { [key: string]: string };
  onSave: (openHours: { [key: string]: string }) => void;
}

export function OpeningHoursModal({
  visible,
  onClose,
  openHours,
  onSave,
}: OpeningHoursModalProps) {
  const [localOpenHours, setLocalOpenHours] = useState(openHours);
  const [timePickerModal, setTimePickerModal] = useState<{
    day: string;
    which: "open" | "close";
  } | null>(null);
  const [tempTime, setTempTime] = useState("08:00");
  const [showPicker, setShowPicker] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalOpenHours(openHours);
  }, [openHours]);

  const handleTimeChange = (
    day: string,
    which: "open" | "close",
    time: string
  ) => {
    const [open, close] = (localOpenHours[day] || "08:00-20:00").split("-");
    setLocalOpenHours({
      ...localOpenHours,
      [day]: which === "open" ? `${time}-${close}` : `${open}-${time}`,
    });
  };

  const showTimePicker = (day: string, which: "open" | "close") => {
    setTempTime(
      (localOpenHours[day] || "08:00-20:00").split("-")[which === "open" ? 0 : 1]
    );
    setTimePickerModal({ day, which });
    setShowPicker(true);
  };

  const saveTime = () => {
    if (timePickerModal) {
      handleTimeChange(timePickerModal.day, timePickerModal.which, tempTime);
      setTimePickerModal(null);
      setShowPicker(false);
    }
  };

  const handleSave = () => {
    console.log("Modal saving hours:", localOpenHours);
    onSave(localOpenHours);
    onClose();
  };

  const handleClose = () => {
    setLocalOpenHours(openHours); // Reset to original values
    setTimePickerModal(null);
    setShowPicker(false);
    onClose();
  };

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalOpenHours(openHours);
    }
  }, [visible, openHours]);

  
  

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-gray-800 rounded-t-3xl max-h-[80%] border-t border-gray-600">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-600">
            <Text className="text-white text-xl font-bold">Opening Hours</Text>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-gray-600 items-center justify-center"
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <Text className="text-gray-300 text-sm mb-4">
              Set your club's operating hours for each day of the week
            </Text>
            
            {/* Debug info - remove in production */}
            <Text className="text-gray-400 text-xs mb-4">
              Debug: {Object.keys(localOpenHours).length} hours loaded
            </Text>
            
            {days.map((day) => {
              const [open, close] = (localOpenHours[day] || "08:00-20:00").split("-");
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
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-gray-600">
            <TouchableOpacity
              className="w-full bg-primary rounded-xl py-4 items-center"
              onPress={handleSave}
            >
              <Text className="text-white text-base font-semibold">Save Hours</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={!!timePickerModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-gray-800 rounded-2xl p-6 mx-4 min-w-[280px] border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4 text-center">
              Set {timePickerModal?.which === "open" ? "Opening" : "Closing"} Time
            </Text>
            
            {Platform.OS === "web" ? (
              <TextInput
                className="bg-gray-700 rounded-xl px-4 py-3 mb-4 border border-gray-500 text-white text-center text-lg"
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="08:00"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              showPicker && (
                <View className="mb-4 bg-gray-700 rounded-xl p-4">
                  <DateTimePicker
                    value={parseTime(tempTime)}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(
                      event: DateTimePickerEvent,
                      date?: Date | undefined
                    ) => {
                      if (date) {
                        setTempTime(formatTime(date));
                      }
                    }}
                    style={{ backgroundColor: "transparent" }}
                  />
                </View>
              )
            )}
            
            <TouchableOpacity
              className="w-full bg-primary rounded-xl py-3 items-center"
              onPress={saveTime}
            >
              <Text className="text-white font-medium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
