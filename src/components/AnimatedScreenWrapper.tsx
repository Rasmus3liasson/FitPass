import React, { useEffect } from 'react';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale' | 'slideUp';
  duration?: number;
  delay?: number;
  onAnimationComplete?: () => void;
}

export function AnimatedScreenWrapper({
  children,
  animationType = 'slide',
  duration = 300,
  delay = 0,
  onAnimationComplete,
}: AnimatedScreenWrapperProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      progress.value = withTiming(
        1,
        {
          duration,
        },
        (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
    };

    if (delay > 0) {
      const timeout = setTimeout(startAnimation, delay);
      return () => clearTimeout(timeout);
    } else {
      startAnimation();
    }
  }, [duration, delay, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'fade':
        return {
          opacity: progress.value,
        };
      
      case 'scale':
        return {
          opacity: progress.value,
          transform: [
            {
              scale: interpolate(progress.value, [0, 1], [0.9, 1]),
            },
          ],
        };
      
      case 'slideUp':
        return {
          opacity: progress.value,
          transform: [
            {
              translateY: interpolate(progress.value, [0, 1], [50, 0]),
            },
          ],
        };
      
      case 'slide':
      default:
        return {
          opacity: progress.value,
          transform: [
            {
              translateX: interpolate(progress.value, [0, 1], [30, 0]),
            },
          ],
        };
    }
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Smooth spring-based transition for tab switching
export function AnimatedTabWrapper({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(0.8, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
