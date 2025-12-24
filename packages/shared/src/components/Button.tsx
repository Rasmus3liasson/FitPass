import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import colors from "../../constants/custom-colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const getButtonClass = () => {
    if (disabled) return "bg-zinc-700 opacity-60";
    switch (variant) {
      case "secondary":
        return "bg-zinc-800";
      case "outline":
        return "bg-transparent border border-indigo-500";
      default:
        return "bg-indigo-500";
    }
  };

  const getTextClass = () => {
    if (typeof style === 'string' && style.includes('border-red-500')) {
      return "text-red-400";
    }
    switch (variant) {
      case "outline":
        return "text-indigo-500";
      case "secondary":
      case "primary":
      default:
        return "text-textPrimary";
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-xl py-3 px-5 items-center justify-center ${getButtonClass()} ${
        style || ""
      }`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-semibold text-base ${getTextClass()}`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function BackButton() {
  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
      onPress={() => {
        if (router.canGoBack?.()) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
      activeOpacity={0.8}
    >
      <ChevronLeft size={24} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

interface AuthBackButtonProps
  extends Pick<ButtonProps, "onPress" | "disabled"> {}

export function AuthBackButton({
  onPress,
  disabled = false,
}: AuthBackButtonProps) {
  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <ChevronLeft size={24} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}
