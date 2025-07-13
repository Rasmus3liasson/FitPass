import { LinearGradient } from "expo-linear-gradient";
import { Activity } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient
      colors={[require("@/src/constants/custom-colors").primary, require("@/src/constants/custom-colors").accentPurple, require("@/src/constants/custom-colors").accentPink]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", width, height }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
          marginBottom: 80,
        }}
      >
        <Animated.View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            borderWidth: 2,
            borderColor: "rgba(255, 255, 255, 0.3)",
            transform: [{ rotate }],
          }}
        >
          <Activity size={60} color={require("@/src/constants/custom-colors").textPrimary} strokeWidth={2.5} />
        </Animated.View>
        <Text className="text-4xl font-bold text-textPrimary mb-2" style={{ textShadowColor: "rgba(0, 0, 0, 0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
          FitPass
        </Text>
        <Text className="text-base font-medium text-textPrimary/90 text-center">Your fitness journey starts here</Text>
      </Animated.View>
      <Animated.View
        style={{
          opacity: fadeAnim,
          position: "absolute",
          bottom: 100,
          width: width * 0.6,
        }}
      >
        <View style={{ height: 4, backgroundColor: "rgba(255, 255, 255, 0.3)", borderRadius: 2, overflow: "hidden" }}>
          <Animated.View
            style={{
              height: "100%",
              backgroundColor: require("@/src/constants/custom-colors").textPrimary,
              borderRadius: 2,
              width: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}