import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface GlobalScreenWrapperProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slideUp' | 'scale' | 'slideInRight';
  duration?: number;
  useSpring?: boolean;
}

export function GlobalScreenWrapper({
  children,
  animationType = 'fade',
  duration = 300,
  useSpring = false,
}: GlobalScreenWrapperProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const translateX = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useFocusEffect(
    React.useCallback(() => {
      // Reset values when screen comes into focus
      opacity.value = 0;
      translateY.value = 20;
      translateX.value = 30;
      scale.value = 0.95;

      // Animate in
      if (useSpring) {
        opacity.value = withSpring(1, { damping: 20, stiffness: 100 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
        scale.value = withSpring(1, { damping: 20, stiffness: 100 });
      } else {
        const config = {
          duration,
          easing: Easing.out(Easing.cubic),
        };
        
        opacity.value = withTiming(1, config);
        translateY.value = withTiming(0, config);
        translateX.value = withTiming(0, config);
        scale.value = withTiming(1, config);
      }

      return () => {
        // Cleanup if needed
      };
    }, [animationType, duration, useSpring])
  );

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slideUp':
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };
      
      case 'scale':
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };
      
      case 'slideInRight':
        return {
          opacity: opacity.value,
          transform: [{ translateX: translateX.value }],
        };
      
      case 'fade':
      default:
        return {
          opacity: opacity.value,
        };
    }
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Higher-order component to wrap screens automatically
export function withGlobalAnimation<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  animationType: 'fade' | 'slideUp' | 'scale' | 'slideInRight' = 'fade'
) {
  return function AnimatedScreen(props: T) {
    return (
      <GlobalScreenWrapper animationType={animationType}>
        <WrappedComponent {...props} />
      </GlobalScreenWrapper>
    );
  };
}
