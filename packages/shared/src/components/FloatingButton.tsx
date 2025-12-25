import React, { ReactNode } from "react";
import { Animated, TouchableOpacity, View, ViewStyle } from "react-native";
import colors from "../constants/custom-colors";

interface FloatingButtonProps {
  onPress: () => void;
  children: ReactNode;
  isVisible?: boolean;
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  disabled?: boolean;
  style?: ViewStyle;
  animationEnabled?: boolean;
  shadowColor?: string;
  overlay?: boolean;
}

export function FloatingButton({
  onPress,
  children,
  isVisible = true,
  position = "bottom-center",
  disabled = false,
  style,
  animationEnabled = true,
  shadowColor = colors.primary,
  overlay = false, // Default to false (non-overlay mode)
}: FloatingButtonProps) {
  const [scale] = React.useState(new Animated.Value(1));

  const handlePress = () => {
    if (disabled) return;

    if (animationEnabled) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onPress();
  };

  if (!isVisible) return null;

  // Position styles
  const getPositionStyle = () => {
    if (!overlay) {
      // Non-overlay mode: button is part of the document flow
      const baseStyle: ViewStyle = {
        /* width: "50%",
        paddingTop: 16,
        marginBottom: 96, */
        
      };

      switch (position) {
        case "bottom-left":
          return {
            ...baseStyle,
            alignSelf: "flex-start" as const,
            marginLeft: 16,
          };
        case "bottom-right":
          return {
            ...baseStyle,
            alignSelf: "flex-end" as const,
            marginRight: 16,
          };
        case "bottom-center":
        default:
          return {
            ...baseStyle,
            alignSelf: "center" as const,
            marginHorizontal: 16,
          };
      }
    }

    // Overlay mode: button floats over content (original behavior)
    const baseStyle: ViewStyle = {
      position: "absolute",
      bottom: 24,
      zIndex: 50,
    };

    switch (position) {
      case "bottom-left":
        return { ...baseStyle, left: 16 };
      case "bottom-right":
        return { ...baseStyle, right: 16 };
      case "bottom-center":
      default:
        return { ...baseStyle, left: 16, right: 16 };
    }
  };

  return (
    <View style={getPositionStyle()}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          className={`rounded-2xl overflow-hidden ${
            disabled ? "opacity-50" : ""
          }`}
          style={[
            {
              shadowColor: shadowColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: disabled ? 0.1 : 0.3,
              shadowRadius: 12,
              elevation: disabled ? 2 : 8,
            },
            style,
          ]}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Convenience component for non-overlay floating button (recommended)
export function FloatingActionButton(
  props: Omit<FloatingButtonProps, "overlay">
) {
  return <FloatingButton {...props} overlay={false} />;
}

// Convenience component for overlay floating button (legacy behavior)
export function OverlayFloatingButton(
  props: Omit<FloatingButtonProps, "overlay">
) {
  return <FloatingButton {...props} overlay={true} />;
}
