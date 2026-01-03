import colors from '@shared/constants/custom-colors';
import { LinearGradient } from "expo-linear-gradient";
import { X } from "phosphor-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_HEIGHT = SCREEN_HEIGHT * 0.65;
const HALF_HEIGHT = SCREEN_HEIGHT * 0.5;

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: number;
  minHeight?: number;
  contentStyle?: ViewStyle;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = MAX_HEIGHT,
  minHeight = HALF_HEIGHT,
  contentStyle,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        className="flex-1 justify-end bg-black/70"
        style={{ opacity: fadeAnim }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          className="overflow-hidden rounded-t-3xl"
          style={{ transform: [{ translateY: slideAnim }], maxHeight }}
        >
          <LinearGradient
            colors={["colors.surface", "colors.background"]}
            style={{ minHeight }}
          >
            <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-textPrimary">{title}</Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-white/10 justify-center items-center"
                onPress={onClose}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            {/* Content */}
            <View className="flex-1" style={contentStyle}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingTop: 0 }}
              >
                {children}
              </ScrollView>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
