import { useAuth } from "@/src/hooks/useAuth";
import React from "react";
import { Alert, Button } from "react-native";

const SignOutButton = () => {
  const { user, signOut } = useAuth();
  return (
    <Button
      title="Sign Out"
      color="#d9534f"
      onPress={() => {
        if (user) {
          Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out",
              style: "destructive",
              onPress: () => signOut(),
            },
          ]);
        }
      }}
    />
  );
};

export default SignOutButton;
