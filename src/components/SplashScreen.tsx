import { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";
import colors from "../constants/custom-colors";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  isDataLoading?: boolean;
}

export function SplashScreen({
  onAnimationComplete,
  isDataLoading = true,
}: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const letterAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start initial animations
    Animated.sequence([
      // 1. Fade in and scale up the text
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // 2. Letter spacing animation
      Animated.timing(letterAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false, // letterSpacing is not supported by native driver
      }),
    ]).start();

    // Start loading animation loop
    const startLoadingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start loading animation after initial animations
    const timer = setTimeout(startLoadingAnimation, 1400);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Effect to handle completion when data loading is done
  useEffect(() => {
    // Only trigger completion callback when data is loaded
    // Don't do any animations here - let the parent handle the transition
    if (!isDataLoading) {
      const timer = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 800); // slight delay before calling completion

      return () => clearTimeout(timer);
    }
  }, [isDataLoading, onAnimationComplete]);

  // Interpolate letter spacing for animation
  const animatedLetterSpacing = letterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -0.5],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* App name with animated letter spacing */}
        <Animated.Text
          style={{
            fontSize: 42,
            fontWeight: "900",
            color: colors.textPrimary,
            marginBottom: 16,
            letterSpacing: animatedLetterSpacing,
            textAlign: "center",
            fontFamily: "Montserrat_700Bold",
          }}
        >
          FitPass
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={{
            fontSize: 18,
            color: colors.textSecondary,
            textAlign: "center",
            fontWeight: "500",
            opacity: fadeAnim,
            fontFamily: "Montserrat_500Medium",
          }}
        >
          Your fitness journey starts here
        </Animated.Text>
      </Animated.View>

      {/* Animated loading indicator */}
      <View style={{ position: "absolute", bottom: 100, alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
                marginHorizontal: 4,
                opacity: fadeAnim,
                transform: [
                  {
                    scale: loadingAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1],
                    }),
                  },
                  {
                    translateY: loadingAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, -8, 0],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
        <Animated.Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            opacity: fadeAnim,
            fontFamily: "Montserrat_400Regular",
          }}
        >
          {isDataLoading ? "Laddar..." : "Redo!"}
        </Animated.Text>
      </View>
    </View>
  );
}
