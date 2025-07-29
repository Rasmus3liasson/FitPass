import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="membership-details" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}
