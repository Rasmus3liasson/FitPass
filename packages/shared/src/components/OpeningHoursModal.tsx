import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import colors from '@shared/constants/custom-colors';
import { X } from "phosphor-react-native";
import { useEffect, useState } from "react";
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
  monday: "Måndag",
  tuesday: "Tisdag",
  wednesday: "Onsdag",
  thursday: "Torsdag",
  friday: "Fredag",
  saturday: "Lördag",
  sunday: "Söndag",
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
    <View className="mb-4 p-3 bg-accentGray rounded-xl border border-accentGray">
      <View className="flex-row items-center">
        <Text className="w-16 text-textPrimary font-semibold text-sm">
          {dayLabels[day]}
        </Text>
        <View className="flex-1 flex-row items-center">
          <TouchableOpacity
            className="bg-accentGray rounded-lg flex-1 py-3 mr-3 border border-accentGray items-center"
            onPress={onOpenPress}
            activeOpacity={0.7}
          >
            <Text className="text-textPrimary text-base font-medium">
              {open}
            </Text>
            <Text className="text-textSecondary text-xs mt-1">Öppnar</Text>
          </TouchableOpacity>
          <Text className="text-textSecondary mx-2 font-bold">→</Text>
          <TouchableOpacity
            className="bg-accentGray rounded-lg flex-1 py-3 border border-accentGray items-center"
            onPress={onClosePress}
            activeOpacity={0.7}
          >
            <Text className="text-textPrimary text-base font-medium">
              {close}
            </Text>
            <Text className="text-textSecondary text-xs mt-1">Stänger</Text>
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
      (localOpenHours[day] || "08:00-20:00").split("-")[
        which === "open" ? 0 : 1
      ]
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
        <View className="bg-accentGray rounded-t-3xl h-[85%] border-t border-accentGray">
          {/* Back Button */}
          <View className="p-6 pb-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-textPrimary text-xl font-bold mb-2">
              Öppettider
            </Text>
            <Text className="text-textSecondary text-sm mb-6">
              Ställ in klubbens öppettider för varje dag i veckan
            </Text>

            {days.map((day) => {
              const [open, close] = (
                localOpenHours[day] || "08:00-20:00"
              ).split("-");
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

            {/* Save Button */}
            <View className="mt-6 mb-6">
              <TouchableOpacity
                className="w-full bg-primary rounded-xl py-4 items-center"
                onPress={handleSave}
              >
                <Text className="text-textPrimary text-base font-semibold">
                  Spara öppettider
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={!!timePickerModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-accentGray rounded-2xl p-6 mx-4 min-w-[280px] border border-accentGray">
            <Text className="text-textPrimary text-lg font-semibold mb-4 text-center">
              Sätt{" "}
              {timePickerModal?.which === "open" ? "öppettid" : "stängningstid"}
            </Text>

            {Platform.OS === "web" ? (
              <TextInput
                className="bg-accentGray rounded-xl px-4 py-3 mb-4 border border-accentGray text-textPrimary text-center text-lg"
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="08:00"
                placeholderTextColor={colors.borderGray}
              />
            ) : (
              showPicker && (
                <View className="mb-4 bg-accentGray rounded-xl p-4">
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
                    locale="sv-SE"
                    textColor="white"
                    accentColor={colors.primary}
                    style={{
                      backgroundColor: "transparent",
                    }}
                    themeVariant="dark"
                  />
                </View>
              )
            )}

            <View className="items-center">
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 px-9 items-center justify-center"
                onPress={saveTime}
              >
                <Text className="text-textPrimary font-medium">Spara</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
