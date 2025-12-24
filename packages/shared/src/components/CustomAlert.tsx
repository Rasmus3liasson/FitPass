import { AlertTriangle, Info } from "lucide-react-native";
import React from "react";
import { Animated, Dimensions, Modal, Text, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: "default" | "destructive" | "warning";
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: "OK" }],
  onClose,
  type = "default",
}: CustomAlertProps) {
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

  const getTypeConfig = () => {
    switch (type) {
      case "destructive":
        return {
          icon: <AlertTriangle size={24} color="#FFFFFF" />,
          iconBg: colors.accentRed,
          borderColor: colors.accentRed,
        };
      case "warning":
        return {
          icon: <AlertTriangle size={24} color="#FFFFFF" />,
          iconBg: colors.accentOrange,
          borderColor: colors.accentOrange,
        };
      default:
        return {
          icon: <Info size={24} color="#FFFFFF" />,
          iconBg: colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  const typeConfig = getTypeConfig();
  const { width } = Dimensions.get("window");

  if (!visible) return null;

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
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
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: typeConfig.iconBg,
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              marginBottom: 16,
            }}
          >
            {typeConfig.icon}
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: message ? 8 : 24,
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
          <View style={{ gap: 12 }}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === "destructive";
              const isCancel = button.style === "cancel";
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(button)}
                  style={{
                    backgroundColor: isDestructive
                      ? colors.accentRed
                      : isCancel
                      ? "transparent"
                      : colors.primary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderWidth: isCancel ? 1 : 0,
                    borderColor: isCancel ? colors.accentGray : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isCancel ? colors.textSecondary : "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
