import React from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';

// Simplified version for Expo Go - uses TouchableOpacity's built-in activeOpacity instead of reanimated
interface SmoothPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleValue?: number;
}

export function SmoothPressable({
  children,
  scaleValue = 0.95,
  activeOpacity = 0.7,
  ...props
}: SmoothPressableProps) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// Smooth fade animation for list items using React Native's Animated API
export function FadeInView({
  children,
  delay = 0,
  duration = 300,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    const startAnimation = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay);
      return () => clearTimeout(timeout);
    } else {
      startAnimation();
    }
  }, [delay, duration, fadeAnim, translateY]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}
