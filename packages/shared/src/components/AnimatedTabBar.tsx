import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        { 
          opacity: focused ? 1 : 0.6,
          transform: [{ scale: focused ? 1 : 0.8 }]
        }
      ]}>
        {children}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: focused ? '#6366F1' : '#9CA3AF',
              opacity: focused ? 1 : 0.6,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
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
  const translateX = (activeIndex * 100) / totalTabs;

  return (
    <View
      style={[
        styles.indicator,
        {
          width: `${100 / totalTabs}%`,
          transform: [{ translateX }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
});
