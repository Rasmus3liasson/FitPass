import colors from "@shared/constants/custom-colors";
import { formatSwedishTime } from "@shared/utils/time";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar, MapPinIcon, X } from "phosphor-react-native";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FadeInView, SmoothPressable } from "../SmoothPressable";
import { SwipeableModal } from "../SwipeableModal";

interface ClassItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  club_id: string;
  clubs?: { name: string };
  intensity?: "Low" | "Medium" | "High";
  max_participants?: number;
  current_participants?: number;
  instructor?: {
    profiles?: { display_name: string };
  };
}

interface ClassesDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  classes: ClassItem[];
  loading: boolean;
  onClassSelect: (classItem: ClassItem) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Idag";
  if (isTomorrow(date)) return "Imorgon";
  if (isYesterday(date)) return "Igår";

  const day = format(date, "d");
  const month = format(date, "MMM");
  return `${day} ${month}`;
};

export function ClassesDiscoveryModal({
  visible,
  onClose,
  classes,
  loading,
  onClassSelect,
}: ClassesDiscoveryModalProps) {
  return (
    <SwipeableModal visible={visible} onClose={onClose} snapPoint={0.85}>
      <View className="bg-surface flex-1">
        {/* Header */}
        <View className="px-6 pt-5 pb-4 border-b border-borderGray/20">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-textPrimary text-2xl font-bold">
              Upptäck Pass
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text className="text-textSecondary text-sm">
            Boka ditt nästa träningspass
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-textSecondary mt-4">
                Hämtar tillgängliga pass...
              </Text>
            </View>
          ) : classes.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Calendar size={48} color={colors.textSecondary} />
              <Text className="text-textPrimary font-semibold text-lg mt-4 text-center">
                Inga tillgängliga pass
              </Text>
              <Text className="text-textSecondary text-center mt-2">
                Kom tillbaka senare för att se nya träningspass
              </Text>
            </View>
          ) : (
            <View className="px-6 pt-4">
              {classes.map((classItem, index) => {
                const startTime = new Date(classItem.start_time);
                const endTime = new Date(classItem.end_time);
                const duration = Math.round(
                  (endTime.getTime() - startTime.getTime()) / (1000 * 60),
                );

                return (
                  <FadeInView key={classItem.id} delay={index * 50}>
                    <SmoothPressable
                      onPress={() => onClassSelect(classItem)}
                      className="bg-background rounded-xl p-4 mb-3 border border-borderGray/10 active:scale-[0.98]"
                    >
                      <View className="flex-row items-center justify-between">
                        {/* LEFT: Class Info */}
                        <View className="flex-1 pr-3">
                          <Text className="text-textPrimary font-bold text-base mb-2">
                            {classItem.name}
                          </Text>

                          <View className="flex-row items-center mb-1">
                            <Text className="text-textSecondary text-sm mr-1">
                              {classItem.clubs?.name || "Okänd anläggning"}
                            </Text>
                            <MapPinIcon
                              size={16}
                              color={colors.textSecondary}
                              weight="duotone"
                            />
                          </View>
                        </View>

                        {/* RIGHT: Date & Time */}
                        <View className="items-end">
                          <View className="bg-primary/10 px-3 py-1.5 rounded-lg mb-2">
                            <Text className="text-textPrimary text-xs font-semibold">
                              {formatDate(classItem.start_time)}
                            </Text>
                          </View>

                          <Text className="text-textPrimary font-semibold text-sm">
                            {formatSwedishTime(startTime)}
                          </Text>
                        </View>
                      </View>
                    </SmoothPressable>
                  </FadeInView>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SwipeableModal>
  );
}
