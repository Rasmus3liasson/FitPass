import { WarningCircle, Check, Info, X } from "phosphor-react-native";
import React from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";
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
  secondaryButtonText?: string;
  onSecondaryButtonPress?: () => void;
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
  secondaryButtonText,
  onSecondaryButtonPress,
  autoClose = false,
  autoCloseDelay = 2000,
}: FeedbackComponentProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

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
        const timer = setTimeout(handleClose, autoCloseDelay);
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
  }, [visible]);

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
    ]).start(onClose);
  };

  const handleButtonPress = () => {
    onButtonPress ? onButtonPress() : handleClose();
  };

  const getTypeConfig = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return {
          icon: <Check size={24} color={colors.textPrimary} />,
          color: colors.accentGreen,
        };
      case "error":
        return {
          icon: <X size={24} color={colors.textSecondary} />,
          color: colors.surface,
        };
      case "warning":
        return {
          icon: <WarningCircle size={24} color={colors.textSecondary} />,
          color: colors.surface,
        };
      case "info":
        return {
          icon: <Info size={24} color={colors.textSecondary} />,
          color: colors.surface,
        };
    }
  };

  const typeConfig = getTypeConfig(type);
  const { width } = Dimensions.get("window");

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeAnim,
        zIndex: 9999,
      }}
    >
      {/* Backdrop */}
      <Pressable
        style={{ position: "absolute", inset: 0 }}
        onPress={handleClose}
      />

      {/* Modal */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: width * 0.85,
          maxWidth: 400,
          backgroundColor: colors.background,
          borderRadius: 20,
          padding: 24,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: typeConfig.color,
            alignSelf: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {typeConfig.icon}
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.textPrimary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {title}
        </Text>

        {/* Message */}
        {message && (
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
        )}

        {/* Buttons */}
        <View className="flex-row items-center justify-center gap-4 mt-2">
          {/* Primary */}
          <Pressable
            onPress={handleButtonPress}
            className={`rounded-2xl ${
              secondaryButtonText ? "flex-1 py-3.5" : "w-full py-4"
            } bg-primary shadow-md`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text className="text-white text-base font-semibold tracking-wide text-center">
              {buttonText}
            </Text>
          </Pressable>

          {/* Secondary */}
          {secondaryButtonText && (
            <Pressable
              onPress={onSecondaryButtonPress ?? handleClose}
              className="flex-1 py-3.5 rounded-2xl bg-surface"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text className="text-textSecondary text-sm font-semibold text-center">
                {secondaryButtonText}
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
