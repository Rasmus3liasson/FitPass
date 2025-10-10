import { Activity, Clock } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { formatSwedishTime } from "../utils/time";

interface ClassCardProps {
  name: string;
  facility: string;
  image: string;
  time: string;
  duration: string;
  intensity: "Low" | "Medium" | "High";
  spots: number;
  onPress: () => void;
  compact?: boolean;
}

export function ClassCard({
  name,
  facility,
  image,
  time,
  duration,
  intensity,
  spots,
  onPress,
  compact = false,
}: ClassCardProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case "Low":
        return "text-intensityLow";
      case "Medium":
        return "text-intensityMedium";
      case "High":
        return "text-intensityHigh";
      default:
        return "text-textSecondary";
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-2xl overflow-hidden bg-zinc-900 ${
        compact ? "w-44" : "w-56"
      }`}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} className="w-full h-24 opacity-80" />
      <View className="p-3">
        <Text className="text-base font-bold text-textPrimary mb-1">{name}</Text>
        {!compact && (
          <Text className="text-xs text-gray-400 mb-2">{facility}</Text>
        )}
        <View className="gap-1.5 mb-3">
            <View className="flex-row items-center gap-1.5">
            <Clock size={12} color="#a1a1aa" /> 
            <Text className="text-xs text-gray-400">{formatSwedishTime(time, true)}</Text>
            </View>
          <View className="flex-row items-center gap-1.5">
            <Activity size={12} color="#a1a1aa" className={getIntensityClass()} />
            <Text className={`text-xs font-normal ${getIntensityClass()}`}>
              {intensity}
            </Text>
          </View>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="px-2 py-1 bg-indigo-500/10 rounded-xl">
            <Text className="text-xs text-indigo-500 font-medium">
              {spots} spots left
            </Text>
          </View>
          {!compact && (
            <TouchableOpacity
              className="px-3 py-1.5 bg-indigo-500 rounded-xl"
              onPress={onPress}
            >
              <Text className="text-xs font-bold text-textPrimary">Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
