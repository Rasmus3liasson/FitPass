import { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
}

export function SafeAreaWrapper({ children, edges = ['top'], className = '' }: SafeAreaWrapperProps) {
  // On web, we don't need special handling for safe areas
  if (Platform.OS === 'web') {
    return <View className={`flex-1 bg-background ${className}`}>{children}</View>;
  }

  // Use proper SafeAreaView for native platforms
  return (
    <SafeAreaView 
      edges={edges}
      className={`flex-1 bg-background ${className}`}
    >
      {children}
    </SafeAreaView>
  );
}