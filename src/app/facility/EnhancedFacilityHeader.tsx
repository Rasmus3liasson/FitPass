import { BackButton } from "@/components/Button";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bookmark,
  MoreHorizontal,
  Share
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  TouchableOpacity,
  View
} from "react-native";

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
  facilityName?: string;
}

export function EnhancedFacilityHeader({ isBookmarked, onToggle, facilityName }: Props) {
  const [heartScale] = useState(new Animated.Value(1));
  const [bookmarkScale] = useState(new Animated.Value(1));

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
      })
    ]).start();
  };

  const handleShare = () => {
    Alert.alert(
      "Share Facility",
      `Share ${facilityName || 'this facility'} with your friends`,
      [
        { text: "Copy Link", onPress: () => console.log("Copy link") },
        { text: "Share via...", onPress: () => console.log("Share") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleBookmark = () => {
    animateIcon(bookmarkScale);
    onToggle();
  };

  const handleMoreOptions = () => {
    Alert.alert(
      "More Options",
      "What would you like to do?",
      [
        { text: "Report Issue", onPress: () => console.log("Report") },
        { text: "Suggest Edit", onPress: () => console.log("Edit") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <View className="absolute top-0 left-0 right-0 z-20">
      {/* Gradient Background */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
        className="absolute inset-0"
      />
      
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4">
        <BackButton />
        
        <View className="flex-row space-x-3">
          {/* Share Button */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleShare}
          >
            <Share size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Bookmark Button */}
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${
                isBookmarked 
                  ? 'bg-primary/80 backdrop-blur-sm' 
                  : 'bg-white/20 backdrop-blur-sm'
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
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center border border-white/10"
            onPress={handleMoreOptions}
          >
            <MoreHorizontal size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
