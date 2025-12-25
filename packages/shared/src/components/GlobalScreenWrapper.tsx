import React from 'react';
import { View } from 'react-native';

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
  // Simplified version for Expo Go - no animations to avoid worklets mismatch
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
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
