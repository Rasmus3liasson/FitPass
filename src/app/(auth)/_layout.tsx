import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
        presentation: "modal",
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
