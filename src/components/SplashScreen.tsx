import { Zap } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";
import colors from "../constants/custom-colors";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Subtle pulse animation for the icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // After 2.5 seconds, slide out to the left
    const timer = setTimeout(() => {
      pulseAnimation.stop();
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulseAnimation.stop();
    };
  }, [onAnimationComplete]);

  return (
    <Animated.View 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: "center", 
        alignItems: "center",
        transform: [{ translateX: slideAnim }],
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          alignItems: "center",
        }}
      >
        {/* Clean icon container */}
        <Animated.View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Zap size={40} color={colors.textPrimary} fill={colors.textPrimary} />
        </Animated.View>

        {/* App name */}
        <Text 
          style={{ 
            fontSize: 32, 
            fontWeight: "bold", 
            color: colors.textPrimary, 
            marginBottom: 8,
            letterSpacing: -0.5
          }}
        >
          FitPass
        </Text>

        {/* Tagline */}
        <Text 
          style={{ 
            fontSize: 16, 
            color: colors.textSecondary,
            textAlign: "center",
            fontWeight: "500"
          }}
        >
          Your fitness journey starts here
        </Text>
      </Animated.View>

      {/* Simple loading indicator */}
      <View style={{ position: "absolute", bottom: 80 }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            width: 40,
            height: 2,
            backgroundColor: colors.primary,
            borderRadius: 1,
          }}
        />
      </View>
    </Animated.View>
  );
}