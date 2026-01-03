import { Check, MapPin, Plus, Star } from "phosphor-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import colors from "../constants/custom-colors";
import { ClubImage } from "../types";
import { OpenStatus } from "./OpenStatus";

interface FacilityCardProps {
  name: string;
  type: string;
  image: string;
  rating?: number;
  distance?: string;
  open_hours?: Record<string, string>;
  credits?: number;
  onPress: () => void;
  layout?: "horizontal" | "grid" | "list";
  club_images?: ClubImage[];
  avatar_url?: string;
  isDailyAccessSelected?: boolean;
  showDailyAccessIndicator?: boolean;
  onAddToDailyAccess?: () => void;
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
  club_images,
  avatar_url,
  isDailyAccessSelected = false,
  showDailyAccessIndicator = false,
  onAddToDailyAccess,
}: FacilityCardProps) {
  const getContainerClasses = () => {
    const baseClasses =
      "rounded-2xl overflow-hidden bg-surface/30 backdrop-blur-sm border border-surface/20 shadow-lg";

    switch (layout) {
      case "grid":
        return `${baseClasses} w-full h-[220px]`;
      case "list":
        return `${baseClasses} flex-row mb-4 h-[100px]`;
      default:
        return `${baseClasses} w-[220px] h-[220px] mr-2.5 mb-4`;
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
    return layout === "list" ? "flex-1 p-3 pl-0" : "p-4 flex-1 justify-between";
  };

  const getImageUri = () => {
    if (club_images && club_images.length > 0) {
      // Look for avatar type first, then poster, then any image
      const avatarImage = club_images.find((img) => img.type === "avatar");
      if (avatarImage) return avatarImage.url;

      const posterImage = club_images.find((img) => img.type === "poster");
      if (posterImage) return posterImage.url;

      // Return first image if no specific type found
      return club_images[0].url;
    }

    if (avatar_url) return avatar_url;
    if (image) return image;
    return "https://via.placeholder.com/150";
  };

  return (
    <TouchableOpacity
      className={getContainerClasses()}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: getImageUri() }} className={getImageClasses()} />

      <View className={getContentClasses()}>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-primary font-bold uppercase tracking-wide">
            {type}
          </Text>
          {rating !== undefined && (
            <View className="flex-row items-center gap-1">
              <Star
                size={12}
                fill={colors.accentYellow}
                color={colors.accentYellow}
              />
              <Text className="text-xs font-bold text-textPrimary">
                {rating}
              </Text>
            </View>
          )}
        </View>

        <Text
          className="text-base font-bold text-textPrimary mb-2 leading-tight"
          numberOfLines={2}
        >
          {name}
        </Text>

        <View className="flex-row justify-between items-center mt-1">
          {distance && (
            <View className="flex-row items-center gap-1">
              <MapPin size={12} color={colors.textSecondary} />
              <Text className="text-xs text-textSecondary opacity-80">
                {distance}
              </Text>
            </View>
          )}

          <View className="relative bottom-1">
            {open_hours && <OpenStatus open_hours={open_hours} />}
          </View>
        </View>

        {/* Daily Access Indicator - Absolutely positioned */}
        {showDailyAccessIndicator && (
          <View className="absolute bottom-3 right-3">
            {isDailyAccessSelected ? (
              // Show check icon when gym is already selected
              <View className="bg-accentGreen rounded-full w-7 h-7 items-center justify-center shadow-lg">
                <Check size={14} color="white" strokeWidth={2.5} />
              </View>
            ) : (
              // Show plus button when gym can be added
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  onAddToDailyAccess?.();
                }}
                className="bg-primary rounded-full w-7 h-7 items-center justify-center shadow-lg"
                activeOpacity={0.8}
              >
                <Plus size={14} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {credits !== undefined && (
          <View
            className={`absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-xl border border-primary/30 ${
              showDailyAccessIndicator ? "mb-10" : ""
            }`}
          >
            <Text className="text-xs font-bold text-textPrimary">
              {credits} credit{credits !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
