import { BackButton } from "@/components/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, ShareIcon } from "lucide-react-native";
import React, { useState } from "react";
import { Animated, Share, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
  facilityName?: string;
}

export function EnhancedFacilityHeader({
  isBookmarked,
  onToggle,
  facilityName,
}: Props) {
  const [heartScale] = useState(new Animated.Value(1));
  const [bookmarkScale] = useState(new Animated.Value(1));
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
        message: `Check out ${
          facilityName || "this facility"
        } on ${process.env.APP_NAME}!\n${process.env.APP_URL}/facility`,
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

/*   const handleMoreOptions = () => {
    Alert.alert("More Options", "What would you like to do?", [
      { text: "Report Issue", onPress: () => console.log("Report") },
      { text: "Suggest Edit", onPress: () => console.log("Edit") },
      { text: "Cancel", style: "cancel" },
    ]);
  }; */

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

        <View className="flex-row space-x-3">
          {/* Share Button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleShare}
          >
            {/* Use a share icon from lucide-react-native or another icon library if desired */}
            <ShareIcon size={20} color="#FFFFFF" />
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
                color="#FFFFFF"
                fill={isBookmarked ? "#FFFFFF" : "none"}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* More Options */}
        {/*   <TouchableOpacity
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleMoreOptions}
          >
            <MoreHorizontal size={20} color="#FFFFFF" />
          </TouchableOpacity> */}
        </View>
      </View>
    </View>
  );
}
