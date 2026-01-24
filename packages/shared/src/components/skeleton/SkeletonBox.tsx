import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  rounded = 'md',
  className = '',
  style,
}) => {
  const twClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded];

  // Inline styles (fully type-safe)
  const inlineStyle: ViewStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...(width !== undefined && { width: width as ViewStyle['width'] }),
    ...(height !== undefined && { height: height as ViewStyle['height'] }),
  };

  return <View className={`${twClasses} ${className}`} style={[inlineStyle, style]} />;
};
