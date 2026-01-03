import colors from '@shared/constants/custom-colors';
import { BackButton } from "@shared/components/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, Check, Clock, Loader, Plus, ShareIcon } from "lucide-react-native";
import { useState } from "react";
import { Animated, Share, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
  facilityName?: string;
  // Daily Access props
  showDailyAccess?: boolean;
  isInDailyAccess?: boolean;
  canAddMoreGyms?: boolean;
  onDailyAccessToggle?: () => void;
  isDailyAccessLoading?: boolean;
  gymStatus?: string | null;
}

export function EnhancedFacilityHeader({
  isBookmarked,
  onToggle,
  facilityName,
  showDailyAccess = false,
  isInDailyAccess = false,
  canAddMoreGyms = true,
  onDailyAccessToggle,
  isDailyAccessLoading = false,
  gymStatus = null,
}: Props) {
  const [heartScale] = useState(new Animated.Value(1));
  const [bookmarkScale] = useState(new Animated.Value(1));
  const [dailyAccessScale] = useState(new Animated.Value(1));
  const insets = useSafeAreaInsets();

  const animateIcon = (animation: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${facilityName || "this facility"} on ${
          process.env.APP_NAME
        }!\n${process.env.APP_URL}/facility`,
        title: facilityName ? `Share ${facilityName}` : "Share Facility",
      });
    } catch (error) {
      // Optionally handle error or cancellation
    }
  };

  const handleBookmark = () => {
    animateIcon(bookmarkScale);
    onToggle();
  };

  const handleDailyAccess = () => {
    if (isDailyAccessLoading || !onDailyAccessToggle) return;
    animateIcon(dailyAccessScale);
    onDailyAccessToggle();
  };

  const getDailyAccessIcon = () => {
    if (isDailyAccessLoading) {
      return <Loader size={18} color="white" />;
    }
    if (isInDailyAccess) {
      // Show clock icon for pending gyms
      if (gymStatus === "pending" || gymStatus === "pending_replacement") {
        return <Clock size={18} color="white" />;
      }
      // Show check icon for active gyms
      return <Check size={18} color="white" />;
    }
    return <Plus size={18} color="white" />;
  };

  const getDailyAccessStyle = () => {
    if (isDailyAccessLoading) {
      return "bg-gray-500/80 backdrop-blur-sm";
    }
    if (isInDailyAccess) {
      // Show orange/yellow for pending gyms
      if (gymStatus === "pending" || gymStatus === "pending_replacement") {
        return "bg-orange-500/80 backdrop-blur-sm";
      }
      // Show green for active gyms
      return "bg-green-500/80 backdrop-blur-sm";
    }
    if (!canAddMoreGyms) {
      return "bg-gray-500/80 backdrop-blur-sm";
    }
    return "bg-primary/80 backdrop-blur-sm";
  };

  return (
    <View className="absolute top-0 left-0 right-0 z-20">
      {/* Gradient Background */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)", "transparent"]}
        className="absolute inset-0"
      />

      <View
        className="flex-row justify-between items-center px-4 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <BackButton />

        <View className="flex-row space-x-3 gap-1">
          {/* Daily Access Button - Only show for eligible users */}
          {showDailyAccess && (
            <Animated.View style={{ transform: [{ scale: dailyAccessScale }] }}>
              <TouchableOpacity
                className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${getDailyAccessStyle()}`}
                onPress={handleDailyAccess}
                disabled={
                  isDailyAccessLoading || (!canAddMoreGyms && !isInDailyAccess)
                }
                activeOpacity={0.8}
              >
                {getDailyAccessIcon()}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Share Button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleShare}
          >
            <ShareIcon size={20} color="white" />
          </TouchableOpacity>

          {/* Bookmark Button */}
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${
                isBookmarked
                  ? "bg-primary/80 backdrop-blur-sm"
                  : "bg-black/60 backdrop-blur-sm"
              }`}
              onPress={handleBookmark}
            >
              <Bookmark
                size={20}
                color="white"
                fill={isBookmarked ? "white" : "none"}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* More Options */}
          {/*   <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleMoreOptions}
          >
            <MoreHorizontal size={20} color="white" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
}
