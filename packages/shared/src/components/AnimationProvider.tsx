import { useFocusEffect } from '@react-navigation/native';
import React, { createContext, useContext, useRef } from 'react';
import { Animated } from 'react-native';

interface AnimationConfig {
  type: 'fade' | 'slideUp' | 'scale' | 'slideInRight';
  duration: number;
}

const AnimationContext = createContext<AnimationConfig>({
  type: 'fade',
  duration: 300,
});

export function AnimationProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: Partial<AnimationConfig>;
}) {
  const defaultConfig: AnimationConfig = {
    type: 'fade',
    duration: 300,
    ...config,
  };

  return <AnimationContext.Provider value={defaultConfig}>{children}</AnimationContext.Provider>;
}

export function AnimatedScreen({ children }: { children: React.ReactNode }) {
  const config = useContext(AnimationContext);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const translateX = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Reset values
      opacity.setValue(0);
      translateY.setValue(20);
      translateX.setValue(30);
      scale.setValue(0.95);

      // Animate in based on config
      const timingConfig = {
        duration: config.duration,
        useNativeDriver: true,
      };

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, ...timingConfig }),
        Animated.timing(translateY, { toValue: 0, ...timingConfig }),
        Animated.timing(translateX, { toValue: 0, ...timingConfig }),
        Animated.timing(scale, { toValue: 1, ...timingConfig }),
      ]).start();
    }, [config, opacity, translateY, translateX, scale])
  );

  const getAnimatedStyle = () => {
    switch (config.type) {
      case 'slideUp':
        return {
          opacity,
          transform: [{ translateY }],
        };

      case 'scale':
        return {
          opacity,
          transform: [{ scale }],
        };

      case 'slideInRight':
        return {
          opacity,
          transform: [{ translateX }],
        };

      case 'fade':
      default:
        return {
          opacity,
        };
    }
  };

  return <Animated.View style={[{ flex: 1 }, getAnimatedStyle()]}>{children}</Animated.View>;
}

// HOC to wrap any screen with animations
export function withScreenAnimation<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AnimatedScreenWrapper(props: T) {
    return (
      <AnimatedScreen>
        <WrappedComponent {...props} />
      </AnimatedScreen>
    );
  };
}
