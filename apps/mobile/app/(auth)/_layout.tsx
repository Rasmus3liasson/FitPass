import { Stack } from "expo-router";
import React from "react";

import { GlobalScreenWrapper } from "@shared/components/GlobalScreenWrapper";

// Wrapper for auth screens to add animations
function AuthScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GlobalScreenWrapper animationType="slideInRight" duration={300}>
      {children}
    </GlobalScreenWrapper>
  );
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "transparent" },
        presentation: "card",
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="register" />
      <Stack.Screen name="club" />
      <Stack.Screen name="verify-code" />
      {/* <Stack.Screen name="payment-methods" /> */}
    </Stack>
  );
}
