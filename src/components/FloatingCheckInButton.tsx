import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Zap } from "lucide-react-native";
import React from "react";
import {
    Animated,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface FloatingCheckInButtonProps {
  onPress: () => void;
  credits: number;
  facilityName: string;
  isVisible?: boolean;
}

export function FloatingCheckInButton({ 
  onPress, 
  credits, 
  facilityName, 
  isVisible = true 
}: FloatingCheckInButtonProps) {
  const [scale] = React.useState(new Animated.Value(1));

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    onPress();
  };

  if (!isVisible) return null;

  return (
    <View className="absolute bottom-6 left-4 right-4 z-50">
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          className="rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <MapPin size={16} color="#FFFFFF" />
                  <Text className="text-white font-bold text-base ml-2">
                    Check In
                  </Text>
                </View>
                <Text className="text-white/80 text-sm" numberOfLines={1}>
                  {facilityName}
                </Text>
              </View>
              
              <View className="bg-white/20 rounded-full px-3 py-2 flex-row items-center">
                <Zap size={14} color="#FFFFFF" />
                <Text className="text-white font-bold text-sm ml-1">
                  {credits}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
