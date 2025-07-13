import { ReactNode } from 'react';
import { Platform, View } from 'react-native';

interface SafeAreaWrapperProps {
  children: ReactNode;
}

export function SafeAreaWrapper({ children }: SafeAreaWrapperProps) {
  // On web, we don't need special handling for safe areas
  if (Platform.OS === 'web') {
    return <View className="flex-1 bg-zinc-950">{children}</View>;
  }

  // On native platforms, we'd use SafeAreaView from react-native-safe-area-context
  // but for this example, we'll use a regular View with padding
  return (
    <View className="flex-1 bg-zinc-950">
      <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 44 : 24, paddingBottom: Platform.OS === 'ios' ? 34 : 16 }}>{children}</View>
    </View>
  );
}