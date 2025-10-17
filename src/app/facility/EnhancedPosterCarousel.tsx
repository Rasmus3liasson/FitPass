import { PhotoGalleryModal } from "@/components/PhotoGalleryModal";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface Props {
  images: string[];
  facilityName?: string;
}

export function EnhancedPosterCarousel({ images, facilityName }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollPosition / width);
    setCurrentIndex(newIndex);
  };

  const openGallery = (index: number = currentIndex) => {
    setShowGallery(true);
  };

  if (!images.length) {
    return (
      <View className="h-80 bg-surface items-center justify-center">
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mb-4">
            <ImageIcon size={32} color="#6366F1" />
          </View>
          <Text className="text-textSecondary text-base">No images available</Text>
          <Text className="text-textSecondary text-sm mt-1">for {facilityName}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="relative">
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="h-80"
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openGallery(index)}
              activeOpacity={0.9}
              className="relative"
            >
              <Image
                source={{ uri: image }}
                style={{ width, height: 320 }}
                resizeMode="cover"
              />

              {/* Gradient overlay for better text readability */}
              <LinearGradient
                colors={["transparent", "transparent", "rgba(0,0,0,0.4)"]}
                className="absolute inset-0"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Photo Indicators */}
        {images.length > 1 && (
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row justify-center items-center space-x-2">
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    scrollViewRef.current?.scrollTo({
                      x: index * width,
                      animated: true,
                    });
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Camera Icon for viewing all photos */}
        {images.length > 1 && (
          <TouchableOpacity
            className="absolute bottom-4 right-4 bg-black/50 rounded-full p-3"
            onPress={() => openGallery(currentIndex)}
          >
            <View className="flex-row items-center">
              <Camera size={16} color="#FFFFFF" />
              <Text className="text-textPrimary text-sm font-medium ml-2">
                {images.length}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        visible={showGallery}
        images={images}
        initialIndex={currentIndex}
        facilityName={facilityName}
        onClose={() => setShowGallery(false)}
      />
    </>
  );
}
