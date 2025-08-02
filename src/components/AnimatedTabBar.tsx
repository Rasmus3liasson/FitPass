import React from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SmoothPressable } from './SmoothPressable';

interface AnimatedTabBarIconProps {
  children: React.ReactNode;
  focused: boolean;
  label?: string;
  onPress?: () => void;
}

export function AnimatedTabBarIcon({
  children,
  focused,
  label,
  onPress,
}: AnimatedTabBarIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.8);
  const opacity = useSharedValue(focused ? 1 : 0.6);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.8, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [0.8, 1], [0.6, 1]),
  }));

  return (
    <SmoothPressable
      onPress={onPress}
      style={{ alignItems: 'center', flex: 1 }}
      scaleValue={0.9}
    >
      <Animated.View style={[{ alignItems: 'center' }, animatedStyle]}>
        {children}
      </Animated.View>
      {label && (
        <Animated.Text
          style={[
            {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
              color: focused ? '#6366F1' : '#9CA3AF',
            },
            labelAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      )}
    </SmoothPressable>
  );
}

// Animated indicator for tab bar
export function TabBarIndicator({ 
  activeIndex, 
  totalTabs 
}: { 
  activeIndex: number; 
  totalTabs: number; 
}) {
  const translateX = useSharedValue(0);
  
  React.useEffect(() => {
    translateX.value = withSpring(
      (activeIndex * 100) / totalTabs,
      {
        damping: 20,
        stiffness: 100,
      }
    );
  }, [activeIndex, totalTabs]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [0, 100],
          [0, 100] // This will be adjusted based on actual tab width
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          height: 3,
          width: `${100 / totalTabs}%`,
          backgroundColor: '#6366F1',
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}
