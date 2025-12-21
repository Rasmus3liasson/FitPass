import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Animated,
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: number;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  height = 400,
}) => {
  const translateY = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, height]);

  if (!visible) return null;

  return (
    <RNModal transparent visible={visible} animationType="none">
      <View className="flex-1 justify-end">
        <BlurView intensity={20} style={{ ...StyleSheet.absoluteFillObject }} />
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          className="bg-white rounded-t-2xl px-5 pt-5 pb-0"
          style={{
            transform: [{ translateY }],
            height,
          }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-semibold">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}; 