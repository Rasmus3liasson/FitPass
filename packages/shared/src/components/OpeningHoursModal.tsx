import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "@shared/constants/custom-colors";
import { DAYS, DAY_LABELS } from "@shared/constants/days";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PageHeader } from "./PageHeader";
import { SwipeableModal } from "./SwipeableModal";

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
  isClosed,
  onOpenPress,
  onClosePress,
  onToggleClosed,
}: {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
  onOpenPress: () => void;
  onClosePress: () => void;
  onToggleClosed: () => void;
}) {
  return (
    <View className="mb-2 p-2.5 bg-surface rounded-lg">
      <View className="flex-row items-center justify-between">
        <Text className="text-textPrimary font-semibold text-sm flex-1">
          {DAY_LABELS[day]}
        </Text>
        {!isClosed ? (
          <View className="flex-row items-center flex-1 justify-end">
            <TouchableOpacity
              className="bg-accentGray rounded-lg px-3 py-2 mr-1.5"
              onPress={onOpenPress}
              activeOpacity={0.7}
            >
              <Text className="text-textPrimary text-sm font-medium">
                {open}
              </Text>
            </TouchableOpacity>
            <Text className="text-textSecondary text-xs mx-1">-</Text>
            <TouchableOpacity
              className="bg-accentGray rounded-lg px-3 py-2 ml-1.5"
              onPress={onClosePress}
              activeOpacity={0.7}
            >
              <Text className="text-textPrimary text-sm font-medium">
                {close}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-accentRed text-sm font-medium">Stängt</Text>
        )}
        <TouchableOpacity
          onPress={onToggleClosed}
          className="ml-3 px-2 py-1 rounded-md bg-primary/10"
          activeOpacity={0.7}
        >
          <Text className="text-textPrimary text-xs font-medium">
            {isClosed ? "Öppna" : "Stäng"}
          </Text>
        </TouchableOpacity>
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
    setLocalOpenHours(openHours);
    setTimePickerModal(null);
    setShowPicker(false);
    onClose();
  };

  return (
    <>
      <SwipeableModal visible={visible} onClose={handleClose} snapPoint={0.65}>
        <View className="bg-surface">
          {/* Header */}

          <View className="flex-1">
            <PageHeader
              title="Redigera Öppettider"
              subtitle="Anpassa öppetider för varje dag"
            />
          </View>

          {/* Content */}
          <View className="max-h-[420px] px-6 py-3">
            {DAYS.map((day) => {
              const hours = localOpenHours[day] || "08:00-20:00";
              const isClosed = hours === "Stängt" || hours === "closed";
              const [open, close] = isClosed
                ? ["08:00", "20:00"]
                : hours.split("-");

              return (
                <TimeRow
                  key={day}
                  day={day}
                  open={open}
                  close={close}
                  isClosed={isClosed}
                  onOpenPress={() => showTimePicker(day, "open")}
                  onClosePress={() => showTimePicker(day, "close")}
                  onToggleClosed={() => {
                    setLocalOpenHours({
                      ...localOpenHours,
                      [day]: isClosed ? "08:00-20:00" : "Stängt",
                    });
                  }}
                />
              );
            })}
          </View>

          {/* Save Button */}
          <View className="px-6 pb-6 pt-3 border-t border-borderGray/20">
            <TouchableOpacity
              className="w-full bg-primary rounded-xl py-3.5 items-center"
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">
                Spara öppettider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SwipeableModal>

      {/* Time Picker Modal */}
      <Modal visible={!!timePickerModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-accentGray rounded-2xl p-6 mx-4 min-w-[280px]">
            <Text className="text-textPrimary text-lg font-semibold mb-4 text-center">
              Sätt{" "}
              {timePickerModal?.which === "open" ? "öppettid" : "stängningstid"}
            </Text>

            {Platform.OS === "web" ? (
              <TextInput
                className="bg-accentGray rounded-xl px-4 py-3 mb-4 text-textPrimary text-center text-lg"
                value={tempTime}
                onChangeText={setTempTime}
                placeholder="08:00"
                placeholderTextColor={colors.borderGray}
              />
            ) : (
              showPicker && (
                <DateTimePicker
                  value={parseTime(tempTime)}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
                    if (date) setTempTime(formatTime(date));
                  }}
                  locale="sv-SE"
                />
              )
            )}

            <TouchableOpacity
              className="bg-primary rounded-xl py-3 mt-4 items-center"
              onPress={saveTime}
            >
              <Text className="text-white font-medium">Spara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
