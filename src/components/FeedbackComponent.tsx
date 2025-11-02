import { AlertTriangle, Check, Info, X } from "lucide-react-native";
import React from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

type FeedbackType = "success" | "error" | "warning" | "info";

interface FeedbackComponentProps {
  visible: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  buttonText?: string;
  onClose: () => void;
  onButtonPress?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function FeedbackComponent({
  visible,
  type,
  title,
  message,
  buttonText = "OK",
  onClose,
  onButtonPress,
  autoClose = false,
  autoCloseDelay = 3000,
}: FeedbackComponentProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else {
      handleClose();
    }
  };

  const getTypeConfig = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return {
          icon: <Check size={24} color="#ffffff" />,
          backgroundColor: "#10b981",
          borderColor: "#059669",
        };
      case "error":
        return {
          icon: <X size={24} color="#ffffff" />,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} color="#ffffff" />,
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
        };
      case "info":
        return {
          icon: <Info size={24} color="#ffffff" />,
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
        };
    }
  };

  const typeConfig = getTypeConfig(type);
  const { width } = Dimensions.get("window");

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
            opacity: fadeAnim,
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
                maxWidth: width - 40,
                minWidth: 280,
              }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header with Icon */}
              <View
                style={{
                  backgroundColor: typeConfig.backgroundColor,
                  borderBottomColor: typeConfig.borderColor,
                }}
                className="px-6 py-6 items-center border-b-2"
              >
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  }}
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                >
                  {typeConfig.icon}
                </View>
                <Text className="text-white font-bold text-xl text-center">
                  {title}
                </Text>
              </View>

              {/* Content */}
              <View className="px-6 py-6">
                {message && (
                  <Text className="text-textSecondary text-base text-center leading-relaxed mb-6">
                    {message}
                  </Text>
                )}

                {/* Button */}
                <TouchableOpacity
                  onPress={handleButtonPress}
                  style={{
                    backgroundColor: typeConfig.backgroundColor,
                  }}
                  className="rounded-2xl py-4 items-center shadow-sm"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold text-base">
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}