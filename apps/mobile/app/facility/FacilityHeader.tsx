import { BackButton } from "@shared/components/Button";
import { LinearGradient } from "expo-linear-gradient";
import {
    Bookmark,
    Check,
    CircleNotch,
    Clock,
    Plus,
    Share as ShareIcon,
} from "phosphor-react-native";
import { useState } from "react";
import {
    Animated,
    Share as NativeShare,
    TouchableOpacity,
    View,
} from "react-native";
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

export function FacilityHeader({
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
      await NativeShare.share({
        message: `Check out ${facilityName || "this facility"} on ${
          process.env.APP_NAME
        }!\n${process.env.APP_URL}/facility`,
        title: facilityName ? `Share ${facilityName}` : "Share Facility",
      });
    } catch {
      // no-op
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
      return <CircleNotch size={18} color="white" weight="bold" />;
    }

    if (isInDailyAccess) {
      if (gymStatus === "pending" || gymStatus === "pending_replacement") {
        return <Clock size={18} color="white" />;
      }
      return <Check size={18} color="white" />;
    }

    return <Plus size={18} color="white" />;
  };

  const getDailyAccessStyle = () => {
    if (isDailyAccessLoading) {
      return "bg-gray-500/80 backdrop-blur-sm";
    }

    if (isInDailyAccess) {
      if (gymStatus === "pending" || gymStatus === "pending_replacement") {
        return "bg-orange-500/80 backdrop-blur-sm";
      }
      return "bg-green-500/80 backdrop-blur-sm";
    }

    if (!canAddMoreGyms) {
      return "bg-gray-500/80 backdrop-blur-sm";
    }

    return "bg-primary/80 backdrop-blur-sm";
  };

  return (
    <View className="absolute top-0 left-0 right-0 z-20">
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
          {showDailyAccess && (
            <Animated.View style={{ transform: [{ scale: dailyAccessScale }] }}>
              <TouchableOpacity
                className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${getDailyAccessStyle()}`}
                onPress={handleDailyAccess}
                disabled={
                  isDailyAccessLoading ||
                  (!canAddMoreGyms && !isInDailyAccess)
                }
                activeOpacity={0.8}
              >
                {getDailyAccessIcon()}
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleShare}
          >
            <ShareIcon size={20} color="white" />
          </TouchableOpacity>

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
                weight={isBookmarked ? "fill" : "regular"}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
export default FacilityHeader;
