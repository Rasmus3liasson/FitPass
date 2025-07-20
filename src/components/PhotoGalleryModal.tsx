import { LinearGradient } from "expo-linear-gradient";
import { Download, Share, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get('window');

interface PhotoGalleryModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  facilityName?: string;
  onClose: () => void;
}

export function PhotoGalleryModal({
  visible,
  images,
  initialIndex = 0,
  facilityName,
  onClose,
}: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [controlsVisible, setControlsVisible] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * width,
          animated: false,
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(scrollPosition / width);
    setCurrentIndex(newIndex);
  };

  const toggleControls = () => {
    const newValue = controlsVisible ? 0 : 1;
    setControlsVisible(!controlsVisible);
    Animated.timing(fadeAnim, {
      toValue: newValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  if (!visible || !images.length) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View className="flex-1 bg-black">
            {/* Header Controls */}
            <Animated.View 
              style={{ opacity: fadeAnim }}
              className="absolute top-0 left-0 right-0 z-10"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                className="pt-12 pb-6 px-4"
              >
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                  >
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View className="flex-1 items-center">
                    <Text className="text-white font-semibold text-lg" numberOfLines={1}>
                      {facilityName}
                    </Text>
                    <Text className="text-white/60 text-sm">
                      {currentIndex + 1} of {images.length}
                    </Text>
                  </View>

                  <View className="flex-row space-x-2">
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <Share size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                      <Download size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Image Gallery */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              className="flex-1"
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={toggleControls}
                  activeOpacity={1}
                  style={{ width, height }}
                  className="items-center justify-center"
                >
                  <Image
                    source={{ uri: image }}
                    style={{ width: width - 40, height: height * 0.7 }}
                    resizeMode="contain"
                    className="rounded-xl"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bottom Controls */}
            <Animated.View 
              style={{ opacity: fadeAnim }}
              className="absolute bottom-0 left-0 right-0"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                className="pt-6 pb-8 px-4"
              >
                {/* Thumbnail Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  className="mb-4"
                >
                  {images.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setCurrentIndex(index);
                        scrollViewRef.current?.scrollTo({
                          x: index * width,
                          animated: true,
                        });
                      }}
                      className={`w-16 h-12 rounded-lg mr-3 overflow-hidden border-2 ${
                        index === currentIndex 
                          ? 'border-primary' 
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        source={{ uri: image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      {index === currentIndex && (
                        <View className="absolute inset-0 bg-primary/20" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Indicators */}
                <View className="flex-row justify-center items-center space-x-2">
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setCurrentIndex(index);
                        scrollViewRef.current?.scrollTo({
                          x: index * width,
                          animated: true,
                        });
                      }}
                      className={`h-2 rounded-full ${
                        index === currentIndex 
                          ? 'w-8 bg-primary' 
                          : 'w-2 bg-white/30'
                      }`}
                    />
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
