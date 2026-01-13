import colors from '@shared/constants/custom-colors';
import { CaretRightIcon, Icon as PhosphorIcon } from 'phosphor-react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

export interface LabelSettingProps {
  label: string;
  description?: string;
  icon?: PhosphorIcon; // optional icon

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
  showArrow?: boolean;
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
  iconColor = colors.primary,
  iconContainerStyle = "w-12 h-12 rounded-full items-center justify-center mr-4 bg-primary/10",
  switchColors = {
    trackColorFalse: colors.surface,
    trackColorTrue: colors.surface + "66",
    thumbColorActive: colors.primary,
    thumbColorInactive: colors.borderGray,
  },
  showBorder = false,
  containerStyle,
  showArrow = true,
}: LabelSettingProps) {

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
        <Text className="text-textPrimary text-base font-medium mb-1">{label}</Text>
        {description && <Text className="text-textSecondary text-sm">{description}</Text>}
      </View>

      {isToggle && (
        <Switch
          trackColor={{
            false: switchColors.trackColorFalse || colors.surface,
            true: switchColors.trackColorTrue || colors.surface + "66",
          }}
          thumbColor={value ? switchColors.thumbColorActive || colors.primary : switchColors.thumbColorInactive || colors.borderGray}
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
        />
      )}

      {isClickable && !isToggle && showArrow && <CaretRightIcon size={20} color={colors.textSecondary} weight="bold" />}
    </>
  );

  if (isClickable && !isToggle) {
    return (
      <TouchableOpacity className={baseClassName} onPress={onPress} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View className={baseClassName}>{content}</View>;
}
