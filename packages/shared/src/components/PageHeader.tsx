import { ArrowLeft } from "phosphor-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface PageHeaderProps {
  // Main content
  title: string;
  subtitle?: string;

  // Left side elements
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftElement?: React.ReactNode;

  // Right side elements
  avatar?: {
    uri: string;
    onPress?: () => void;
  };
  rightElement?: React.ReactNode;

  // Styling options
  variant?: "default" | "gradient" | "minimal";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;

  // Additional content below title/subtitle
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  leftElement,
  avatar,
  rightElement,
  variant = "default",
  className = "",
  titleClassName = "",
  subtitleClassName = "",
  children,
}: PageHeaderProps) {
  const getHeaderStyles = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-br from-primary via-purple-600 to-pink-500 px-6 pt-16 pb-8 rounded-b-3xl";
      case "minimal":
        return "px-4 py-4";
      default:
        return "px-4 py-4 border-b border-accentGray mb-7";
    }
  };

  const getTitleStyles = () => {
    const baseStyles = "font-bold text-2xl";
    const colorStyles =
      variant === "gradient" ? "text-white" : "text-textPrimary";
    return `${baseStyles} ${colorStyles} ${titleClassName}`;
  };

  const getSubtitleStyles = () => {
    const baseStyles = "text-sm mt-1";
    const colorStyles =
      variant === "gradient" ? "text-white/80" : "text-textSecondary";
    return `${baseStyles} ${colorStyles} ${subtitleClassName}`;
  };

  return (
    <View className={`${getHeaderStyles()} ${className}`}>
      {/* Top row — back button & left controls */}
      {(showBackButton || leftElement) && (
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            {showBackButton && (
              <TouchableOpacity
                onPress={onBackPress}
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor:
                    variant === "gradient"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.05)",
                }}
              >
                <ArrowLeft
                  size={20}
                  color={variant === "gradient" ? "white" : "black"}
                />
              </TouchableOpacity>
            )}
            {leftElement}
          </View>
        </View>
      )}

      {/* Title + right elements (perfect vertical alignment) */}
      <View className="flex-row items-center justify-between">
        {/* Title & Subtitle */}
        <View className="flex-1 pr-3 justify-center">
          <Text className={getTitleStyles()} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className={getSubtitleStyles()} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side content */}
        <View className="flex-row items-center">
          {rightElement}

          {avatar && (
            <TouchableOpacity onPress={avatar.onPress} className="ml-3">
              <Image
                source={{ uri: avatar.uri }}
                className="w-10 h-10 rounded-full"
                style={{
                  borderWidth: variant === "gradient" ? 2 : 1,
                  borderColor:
                    variant === "gradient"
                      ? "rgba(255,255,255,0.3)"
                      : "rgba(0,0,0,0.1)",
                }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Additional content below */}
      {children && <View className="mt-4">{children}</View>}
    </View>
  );
}
