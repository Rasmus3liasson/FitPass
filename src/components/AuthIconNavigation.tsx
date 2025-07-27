import { Building2, UserPlus } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { AuthBackButton } from "./Button";

type AuthType = "sign-in" | "register" | "club" | "forgot-password";

interface AuthIconNavigationProps {
  currentAuthType: AuthType;
  onAuthTypeChange: (authType: AuthType) => void;
  disabled?: boolean;
}

const AuthIconNavigation: React.FC<AuthIconNavigationProps> = ({
  currentAuthType,
  onAuthTypeChange,
  disabled = false,
}) => {
  const getNavigationIcons = () => {
    return [
      {
        type: "register" as AuthType,
        icon: UserPlus,
        active: currentAuthType === "register",
      },
      {
        type: "club" as AuthType,
        icon: Building2,
        active: currentAuthType === "club",
      },
    ];
  };

  const icons = getNavigationIcons();

  // Show back button for all screens except sign-in
  if (currentAuthType !== "sign-in") {
    return (
      <View className="absolute top-12 left-6 z-10">
        <AuthBackButton 
        
          onPress={() => onAuthTypeChange("sign-in")}
          disabled={disabled}
        />
      </View>
    );
  }

  // Show navigation icons only on sign-in screen
  return (
    <View className="absolute top-12 right-6 flex-row space-x-4 z-10">
      {icons.map((iconItem) => (
        <TouchableOpacity
          key={iconItem.type}
          className={`w-12 h-12 rounded-lg items-center justify-center ${
            iconItem.active
              ? "bg-indigo-500"
              : "bg-surface border border-gray-700"
          } ${disabled ? "opacity-50" : ""}`}
          onPress={() => onAuthTypeChange(iconItem.type)}
          disabled={disabled || iconItem.active}
          activeOpacity={0.8}
        >
          <iconItem.icon
            size={24}
            color={iconItem.active ? "#ffffff" : "#9CA3AF"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default AuthIconNavigation;
