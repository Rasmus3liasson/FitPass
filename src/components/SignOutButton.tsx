import { useAuth } from "@/src/hooks/useAuth";
import { LogOut } from "lucide-react-native";
import React from "react";
import { Alert } from "react-native";
import { Button } from "./Button";

const SignOutButton = () => {
  const { user, signOut } = useAuth();
  
  const handleSignOut = () => {
    if (user) {
      Alert.alert(
        "Logga ut", 
        "Are you sure you want to sign out?", 
        [
          { 
            text: "Cancel", 
            style: "cancel" 
          },
          {
            text: "Logga ut",
            style: "destructive",
            onPress: () => signOut(),
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Button
      title="Logga ut"
      onPress={handleSignOut}
      variant="outline"
      icon={<LogOut size={18} color="#ef4444" />}
      style="border-red-500/30 bg-red-500/10 mt-4"
    />
  );
};

export default SignOutButton;
