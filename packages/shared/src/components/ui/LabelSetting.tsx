import { ChevronRight, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

export interface LabelSettingProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  
  // For toggle type
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  
  // For navigation/action type
  onPress?: () => void;
  
  // Styling props
  iconSize?: number;
  iconColor?: string;
  iconContainerStyle?: string;
  switchColors?: {
    trackColorFalse?: string;
    trackColorTrue?: string;
    thumbColorActive?: string;
    thumbColorInactive?: string;
  };
  showBorder?: boolean;
  containerStyle?: string;
}

export function LabelSetting({
  label,
  description,
  icon: Icon,
  value,
  onValueChange,
  disabled = false,
  onPress,
  iconSize = 20,
  iconColor = "#6366F1",
  iconContainerStyle = "w-12 h-12 rounded-full items-center justify-center mr-4 bg-primary/10",
  switchColors = {
    trackColorFalse: "#374151",
    trackColorTrue: "rgba(99, 102, 241, 0.4)",
    thumbColorActive: "#6366F1",
    thumbColorInactive: "#9CA3AF",
  },
  showBorder = false,
  containerStyle,
}: LabelSettingProps) {
  
  // Determine the type based on props
  const isToggle = value !== undefined && onValueChange !== undefined;
  const isClickable = onPress !== undefined;
  
  const baseClassName = `flex-row items-center py-4 ${
    showBorder ? "border-b border-white/10" : ""
  } ${disabled ? "opacity-50" : ""} ${containerStyle || ""}`;

  const content = (
    <>
      {Icon && (
        <View className={iconContainerStyle}>
          <Icon size={iconSize} color={iconColor} />
        </View>
      )}
      <View className="flex-1 mr-4">
        <Text className="text-textPrimary text-base font-medium mb-1">
          {label}
        </Text>
        {description && (
          <Text className="text-textSecondary text-sm">
            {description}
          </Text>
        )}
      </View>
      {isToggle && (
        <Switch
          trackColor={{
            false: switchColors.trackColorFalse || "#374151",
            true: switchColors.trackColorTrue || "rgba(99, 102, 241, 0.4)",
          }}
          thumbColor={value ? (switchColors.thumbColorActive || "#6366F1") : (switchColors.thumbColorInactive || "#9CA3AF")}
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          style={{
            transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
          }}
        />
      )}
      {isClickable && !isToggle && (
        <ChevronRight size={20} color="#A0A0A0" />
      )}
    </>
  );

  if (isClickable && !isToggle) {
    return (
      <TouchableOpacity
        className={baseClassName}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClassName}>
      {content}
    </View>
  );
}