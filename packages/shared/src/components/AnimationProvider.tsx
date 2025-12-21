import { useFocusEffect } from '@react-navigation/native';
import React, { createContext, useContext } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimationConfig {
  type: 'fade' | 'slideUp' | 'scale' | 'slideInRight';
  duration: number;
  useSpring: boolean;
  springConfig?: {
    damping: number;
    stiffness: number;
  };
}

const AnimationContext = createContext<AnimationConfig>({
  type: 'fade',
  duration: 300,
  useSpring: false,
  springConfig: { damping: 20, stiffness: 100 },
});

export function AnimationProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode;
  config?: Partial<AnimationConfig>;
}) {
  const defaultConfig: AnimationConfig = {
    type: 'fade',
    duration: 300,
    useSpring: false,
    springConfig: { damping: 20, stiffness: 100 },
    ...config,
  };

  return (
    <AnimationContext.Provider value={defaultConfig}>
      {children}
    </AnimationContext.Provider>
  );
}

export function AnimatedScreen({ children }: { children: React.ReactNode }) {
  const config = useContext(AnimationContext);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const translateX = useSharedValue(30);
  const scale = useSharedValue(0.95);

  useFocusEffect(
    React.useCallback(() => {
      // Reset values
      opacity.value = 0;
      translateY.value = 20;
      translateX.value = 30;
      scale.value = 0.95;

      // Animate in based on config
      if (config.useSpring && config.springConfig) {
        opacity.value = withSpring(1, config.springConfig);
        translateY.value = withSpring(0, config.springConfig);
        translateX.value = withSpring(0, config.springConfig);
        scale.value = withSpring(1, config.springConfig);
      } else {
        const timingConfig = {
          duration: config.duration,
          easing: Easing.out(Easing.cubic),
        };
        
        opacity.value = withTiming(1, timingConfig);
        translateY.value = withTiming(0, timingConfig);
        translateX.value = withTiming(0, timingConfig);
        scale.value = withTiming(1, timingConfig);
      }
    }, [config])
  );

  const animatedStyle = useAnimatedStyle(() => {
    switch (config.type) {
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

// HOC to wrap any screen with animations
export function withScreenAnimation<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function AnimatedScreenWrapper(props: T) {
    return (
      <AnimatedScreen>
        <WrappedComponent {...props} />
      </AnimatedScreen>
    );
  };
}
