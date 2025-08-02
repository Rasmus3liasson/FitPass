import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface SmoothPressableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleValue?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

export function SmoothPressable({
  children,
  scaleValue = 0.95,
  springConfig = { damping: 15, stiffness: 200 },
  onPressIn,
  onPressOut,
  ...props
}: SmoothPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: any) => {
    scale.value = withSpring(scaleValue, springConfig);
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1, springConfig);
    onPressOut?.(event);
  };

  return (
    <AnimatedTouchableOpacity
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}

// Smooth fade animation for list items
export function FadeInView({
  children,
  delay = 0,
  duration = 300,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    const startAnimation = () => {
      opacity.value = withTiming(1, { duration });
      translateY.value = withTiming(0, { duration });
    };

    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay);
      return () => clearTimeout(timeout);
    } else {
      startAnimation();
    }
  }, [delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
