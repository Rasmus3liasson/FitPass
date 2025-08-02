import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  animationType?: 'slideInRight' | 'slideInLeft' | 'fadeIn' | 'scaleIn' | 'slideUp';
  duration?: number;
}

export function PageTransition({
  children,
  animationType = 'slideInRight',
  duration = 300,
}: PageTransitionProps) {
  const progress = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      // Reset animation when screen comes into focus
      progress.value = 0;
      
      // Start the animation
      if (animationType === 'scaleIn') {
        progress.value = withSpring(1, {
          damping: 20,
          stiffness: 100,
        });
      } else {
        progress.value = withTiming(1, {
          duration,
          easing: Easing.out(Easing.cubic),
        });
      }

      return () => {
        // Reset when leaving
        progress.value = 0;
      };
    }, [animationType, duration])
  );

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slideInLeft':
        return {
          opacity: interpolate(progress.value, [0, 1], [0, 1]),
          transform: [
            {
              translateX: interpolate(progress.value, [0, 1], [-100, 0]),
            },
          ],
        };

      case 'fadeIn':
        return {
          opacity: progress.value,
        };

      case 'scaleIn':
        return {
          opacity: interpolate(progress.value, [0, 1], [0, 1]),
          transform: [
            {
              scale: interpolate(progress.value, [0, 1], [0.8, 1]),
            },
          ],
        };

      case 'slideUp':
        return {
          opacity: interpolate(progress.value, [0, 1], [0, 1]),
          transform: [
            {
              translateY: interpolate(progress.value, [0, 1], [100, 0]),
            },
          ],
        };

      case 'slideInRight':
      default:
        return {
          opacity: interpolate(progress.value, [0, 1], [0, 1]),
          transform: [
            {
              translateX: interpolate(progress.value, [0, 1], [100, 0]),
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

// Hook for smooth tab transitions
export function useTabAnimation(isActive: boolean) {
  const scale = useSharedValue(isActive ? 1 : 0.95);
  const opacity = useSharedValue(isActive ? 1 : 0.8);

  React.useEffect(() => {
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

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
}
