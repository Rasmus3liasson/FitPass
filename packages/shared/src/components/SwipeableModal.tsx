import colors from "@shared/constants/custom-colors";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoint?: number;
  backdropOpacity?: number;
}

export const SwipeableModal: React.FC<SwipeableModalProps> = ({
  visible,
  onClose,
  children,
  snapPoint = 0.9,
  backdropOpacity = 0.5,
}) => {
  const modalHeight = SCREEN_HEIGHT * snapPoint;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);
  const [internalVisible, setInternalVisible] = useState(visible);

  // Sync internal visibility with prop, but delay hiding
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      translateY.setValue(0);
      lastGestureDy.current = 0;
    } else {
      // Delay hiding to prevent flash
      const timer = setTimeout(() => {
        setInternalVisible(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, translateY]);

  const handleClose = () => {
    // First hide the modal visually
    setInternalVisible(false);

    // Then animate and cleanup
    Animated.timing(translateY, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start(() => {
      lastGestureDy.current = 0;
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drags
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        lastGestureDy.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 150px, close the modal
        if (gestureState.dy > 150) {
          handleClose();
        } else {
          // Spring back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start(() => {
            lastGestureDy.current = 0;
          });
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` }}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View
            style={{
              flex: 1,
            }}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={{
            height: modalHeight,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            transform: [{ translateY }],
            overflow: "hidden",
          }}
        >
          <View
            {...panResponder.panHandlers}
            style={{
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: colors.lightBorderGray,
                borderRadius: 2,
              }}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
