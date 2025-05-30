import { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface SafeAreaWrapperProps {
  children: ReactNode;
}

export function SafeAreaWrapper({ children }: SafeAreaWrapperProps) {
  // On web, we don't need special handling for safe areas
  if (Platform.OS === 'web') {
    return <View style={styles.container}>{children}</View>;
  }

  // On native platforms, we'd use SafeAreaView from react-native-safe-area-context
  // but for this example, we'll use a regular View with padding
  return (
    <View style={styles.container}>
      <View style={styles.safeArea}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
});