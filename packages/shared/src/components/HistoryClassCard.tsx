import colors from "@shared/constants/custom-colors";
import { CalendarIcon, MapPin } from "phosphor-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

export interface HistoryClassData {
  id: string;
  name: string;
  facility: string;
  image: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  status: "completed" | "upcoming" | "cancelled";
}

interface HistoryClassCardProps {
  classData: HistoryClassData;
  onPress?: () => void;
  disabled?: boolean;
}

export function HistoryClassCard({
  classData,
  onPress,
  disabled = false,
}: HistoryClassCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.accentGreen;
      case "upcoming":
        return colors.accentBlue;
      case "cancelled":
        return colors.accentRed;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Genomförd";
      case "upcoming":
        return "Kommande";
      case "cancelled":
        return "Avbruten";
      default:
        return status;
    }
  };

  console.log("classData", classData);

  return (
    <TouchableOpacity
      className="bg-surface rounded-2xl p-4"
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="flex-row">
        {/* Class Image */}
        <Image
          source={{ uri: classData.image }}
          className="h-full w-20 rounded-xl"
        />

        {/* Class Info */}
        <View className="flex-1 ml-4">
          {/* Name & Status */}
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-textPrimary font-semibold text-base flex-1"
              numberOfLines={1}
            >
              {classData.name || "Träningspass"}
            </Text>
            <View
              className="px-2 py-1 rounded-full ml-2"
              style={{
                backgroundColor: `${getStatusColor(classData.status)}20`,
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: getStatusColor(classData.status) }}
              >
                {getStatusLabel(classData.status)}
              </Text>
            </View>
          </View>

          {/* Facility */}
          {classData.facility ? (
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-textSecondary text-sm flex-1"
                numberOfLines={1}
              >
                {classData.facility}
              </Text>
              <MapPin size={14} color={colors.textSecondary} />
            </View>
          ) : null}

          {/* Date & Time */}
          {classData.date || classData.time ? (
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-textSecondary text-sm">
                {classData.date} {classData.time ? `• ${classData.time}` : ""}
              </Text>
              <CalendarIcon size={14} color={colors.textSecondary} />
            </View>
          ) : null}

          {/* Duration & Instructor */}
          {/* <View className="flex-row items-center justify-between">
            {classData.duration ? (
              <View className="flex-row items-center">
                <Text className="text-textSecondary text-sm">
                  {classData.duration}
                </Text>
                <Clock size={14} color={colors.textSecondary} />
              </View>
            ) : null}

            {classData.instructor &&
            classData.instructor !== "N/A" &&
            classData.instructor.trim() !== "" ? (
              <View className="flex-row items-center">
                <Text className="text-textSecondary text-sm" numberOfLines={1}>
                  {classData.instructor}
                </Text>
                <User size={14} color={colors.textSecondary} />
              </View>
            ) : null}
          </View> */}
        </View>
      </View>
    </TouchableOpacity>
  );
}
