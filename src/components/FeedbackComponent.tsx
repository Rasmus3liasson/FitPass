import { AlertTriangle, Check, Info, X } from "lucide-react-native";
import React from "react";
import {
  Animated,
  Dimensions
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

}
