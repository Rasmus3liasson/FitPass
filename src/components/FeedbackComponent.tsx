import { AlertTriangle, Check, Info, X } from "lucide-react-native";
import React from "react";
import { Animated, Dimensions } from "react-native";
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

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        opacity: fadeAnim,
        zIndex: 9999,
        elevation: 9999,
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: width * 0.85,
          maxWidth: 400,
          backgroundColor: colors.background,
          borderRadius: 20,
          padding: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
          borderWidth: 2,
          borderColor: typeConfig.borderColor,
        }}
      >
        {/* Icon */}
        <Animated.View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: typeConfig.backgroundColor,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            marginBottom: 16,
          }}
        >
          {typeConfig.icon}
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: colors.textPrimary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Animated.Text>

        {/* Message */}
        {message && (
          <Animated.Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {message}
          </Animated.Text>
        )}

        {/* Button */}
        <Animated.View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 24,
          }}
        >
          <Animated.Text
            onPress={handleButtonPress}
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {buttonText}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
