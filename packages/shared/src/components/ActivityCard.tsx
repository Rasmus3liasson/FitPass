import { Calendar, Clock, MapPin } from "lucide-react-native";
import { Text, View } from "react-native";
import colors from "../constants/custom-colors";

interface ActivityCardProps {
  facilityName: string;
  activityType: string;
  date: string;
  time: string;
  duration: string;
  credits: number;
}

export function ActivityCard({
  facilityName,
  activityType,
  date,
  time,
  duration,
  credits,
}: ActivityCardProps) {
  return (
    <View className="flex-row bg-zinc-900 rounded-xl overflow-hidden mb-3">
      <View className="w-1 bg-indigo-500" />
      <View className="flex-1 p-4">
        <View className="flex-row justify-between mb-3">
          <View>
            <Text className="text-base font-bold text-textPrimary mb-1">
              {activityType}
            </Text>
            <Text className="text-sm text-textSecondary">{facilityName}</Text>
          </View>
          <View className="bg-indigo-500/10 px-2.5 py-1.5 rounded-xl justify-center">
            <Text className="text-xs font-semibold text-indigo-500">
              {credits} credit{credits !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-3">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={14} color={colors.textSecondary} />
            <Text className="text-sm text-textSecondary">{date}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Clock size={14} color={colors.textSecondary} />
            <Text className="text-sm text-textSecondary">{time}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={colors.textSecondary} />
            <Text className="text-sm text-textSecondary">{duration}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
