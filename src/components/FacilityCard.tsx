import { MapPin, Star } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import colors from "../constants/custom-colors";
import { OpenStatus } from "./OpenStatus";

interface FacilityCardProps {
  name: string;
  type: string;
  image: string;
  rating: number;
  distance?: string;
  open_hours?: Record<string, string>;
  credits?: number;
  onPress: () => void;
  layout?: "horizontal" | "grid" | "list";
}

export function FacilityCard({
  name,
  type,
  image,
  rating,
  distance,
  open_hours,
  credits,
  onPress,
  layout = "horizontal",
}: FacilityCardProps) {
  const getContainerClasses = () => {
    const baseClasses = "rounded-2xl overflow-hidden bg-surface/30 backdrop-blur-sm border border-surface/20 shadow-lg";

    switch (layout) {
      case "grid":
        return `${baseClasses} w-full`;
      case "list":
        return `${baseClasses} flex-row mb-4`;
      default:
        return `${baseClasses} w-[220px] mr-2.5 mb-4`;
    }
  };

  const getImageClasses = () => {
    switch (layout) {
      case "grid":
        return "w-full h-[120px]";
      case "list":
        return "w-20 h-20 rounded-lg m-3";
      default:
        return "w-full h-[120px]";
    }
  };

  const getContentClasses = () => {
    return layout === "list" ? "flex-1 p-3 pl-0" : "p-4";
  };

  return (
    <TouchableOpacity
      className={getContainerClasses()}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} className={getImageClasses()} />

      <View className={getContentClasses()}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs text-primary font-bold uppercase tracking-wide">{type}</Text>
          <View className="flex-row items-center gap-1">
            <Star size={12} fill={colors.accentYellow} color={colors.accentYellow} />
            <Text className="text-xs font-bold text-white">{rating}</Text>
          </View>
        </View>

        <Text className="text-base font-bold text-white mb-2 leading-tight" numberOfLines={2}>{name}</Text>

        <View className="flex-row justify-between items-center">
          {distance && (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color={colors.textSecondary} />
              <Text className="text-xs text-textSecondary opacity-80">{distance}</Text>
            </View>
          )}

          <View className="flex-row items-center gap-1">
            <OpenStatus open_hours={open_hours} />
          </View>
        </View>

        {credits !== undefined && (
          <View className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-xl border border-primary/30">
            <Text className="text-xs font-bold text-white">
              {credits} credit{credits !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
