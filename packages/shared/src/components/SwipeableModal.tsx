import React from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  showScrollIndicator?: boolean;
  enableSwipe?: boolean;
  scrollViewProps?: any;
  animationType?: "none" | "slide" | "fade";
  backgroundColor?: string;
}

export function SwipeableModal({
  visible,
  onClose,
  children,
  maxHeight = "85%",
  showScrollIndicator = false,
  enableSwipe = true,
  scrollViewProps = {},
  animationType = "none",
  backgroundColor = "bg-background",
}: SwipeableModalProps) {
  // Gesture handler values
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleClose = () => {
    onClose();
  };

  // Gesture handler for drag to dismiss
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store the starting Y position (context is handled internally now)
    })
    .onUpdate((event) => {
      if (!enableSwipe) return;
      
      const newTranslateY = event.translationY;
      // Only allow downward movement (positive translateY)
      if (newTranslateY >= 0) {
        translateY.value = newTranslateY;
        // Reduce opacity as user drags down
        opacity.value = Math.max(0.3, 1 - newTranslateY / 300);
      }
    })
    .onEnd((event) => {
      if (!enableSwipe) return;
      
      const shouldClose = event.translationY > 150 || event.velocityY > 1000;

      if (shouldClose) {
        // Animate out and close
        translateY.value = withSpring(
          400,
          {
            damping: 20,
            stiffness: 200,
            overshootClamping: true,
          },
          () => {
            runOnJS(handleClose)();
          }
        );
        opacity.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
      } else {
        // Animate back to original position
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
        opacity.value = withSpring(1, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
      }
    });

  // Reset animation values when modal opens
  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
      opacity.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
    }
  }, [visible]);

  // Animated style for the modal
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <Animated.View
                className={`${backgroundColor} rounded-t-3xl max-h-[${maxHeight}]`}
                style={animatedStyle}
              >
                {enableSwipe && (
                  <GestureDetector gesture={panGesture}>
                    <Animated.View className="items-center pt-3 pb-2">
                      <View className="w-12 h-1 bg-accentGray rounded-full"></View>
                      <View className="w-16 h-6 -mt-3 items-center justify-center"></View>
                    </Animated.View>
                  </GestureDetector>
                )}
                
                <ScrollView
                  showsVerticalScrollIndicator={showScrollIndicator}
                  bounces={false}
                  overScrollMode="never"
                  {...scrollViewProps}
                >
                  {children}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </GestureHandlerRootView>
    </Modal>
  );
}