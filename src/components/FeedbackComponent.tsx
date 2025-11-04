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
import colors from "../constants/custom-colors";

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
  autoClose = false, // Changed to false for manual close
  autoCloseDelay = 2000,
}: FeedbackComponentProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  // Debug logging
  React.useEffect(() => {
    console.log("FeedbackComponent props:", { visible, type, title, message });
  }, [visible, type, title, message]);

  React.useEffect(() => {
    if (visible) {
      console.log("Starting show animation");
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

      // Only auto-close if explicitly enabled
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      console.log("Starting hide animation");
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
    console.log("HandleClose called");
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
          icon: <Check size={24} color={colors.textPrimary} />,
          backgroundColor: colors.accentGreen,
          borderColor: colors.accentGreen,
        };
      case "error":
        return {
          icon: <X size={24} color={colors.textPrimary} />,
          backgroundColor: colors.accentRed,
          borderColor: colors.accentRed,
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} color={colors.textPrimary} />,
          backgroundColor: colors.accentOrange,
          borderColor: colors.accentOrange,
        };
      case "info":
        return {
          icon: <Info size={24} color={colors.textPrimary} />,
          backgroundColor: colors.accentBlue,
          borderColor: colors.accentBlue,
        };
    }
  };

  const typeConfig = getTypeConfig(type);
  const { width } = Dimensions.get("window");

  if (!visible) {
    console.log("FeedbackComponent not visible, returning null");
    return null;
  }

  console.log("Rendering FeedbackComponent with:", { title, message, type });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.15)", // Much more subtle backdrop
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
            opacity: fadeAnim,
            zIndex: 9999,
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
                maxWidth: width - 48,
                minWidth: 320,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 24,
                elevation: 12,
              }}
              className="bg-background backdrop-blur-xl rounded-2xl overflow-hidden "
            >
              {/* Minimal Header */}
              <View className="px-6 py-5 flex-row items-center">
                <View
                  style={{
                    backgroundColor: typeConfig.backgroundColor,
                  }}
                  className="w-10 h-10 rounded-full items-center justify-center mr-4"
                >
                  {React.cloneElement(typeConfig.icon, {
                    size: 20,
                    color: "white",
                  })}
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold text-lg">
                    {title || "Meddelande"}
                  </Text>
                  {message && (
                    <Text className="text-textSecondary text-sm mt-0.5 leading-relaxed">
                      {message}
                    </Text>
                  )}
                </View>
              </View>

              {/* Subtle divider */}
              <View className="h-px bg-gray-200/60 mx-6" />

              {/* Actions */}
              <View className="px-6 py-4 flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={handleButtonPress}
                  style={{
                    backgroundColor: typeConfig.backgroundColor,
                  }}
                  className="px-6 py-2.5 rounded-xl"
                  activeOpacity={0.8}
                >
                  <Text className="text-textPrimary font-medium text-sm">
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
