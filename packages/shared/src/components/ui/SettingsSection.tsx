import colors from '@shared/constants/custom-colors';
import { CaretRight, Icon as PhosphorIcon } from 'phosphor-react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

export interface SettingsItem {
  label: string;
  description?: string;
  icon?: PhosphorIcon;
  key?: string;
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  route?: string;
  action?: string;
  type?: 'toggle' | 'navigation' | 'action';
}

interface SettingsSectionProps {
  items: SettingsItem[];
  containerStyle?: string;
  itemStyle?: string;
  iconContainerStyle?: string;
  iconSize?: number;
  iconColor?: string;
  switchColors?: {
    trackColorFalse: string;
    trackColorTrue: string;
    thumbColorActive: string;
    thumbColorInactive: string;
  };
}

export function SettingsSection({
  items,
  containerStyle = 'bg-surface rounded-3xl mx-4 mt-4 px-6 py-3',
  itemStyle,
  iconContainerStyle = 'w-12 h-12 rounded-full items-center justify-center mr-4 bg-primary/10',
  iconSize = 20,
  iconColor = colors.primary,
  switchColors = {
    trackColorFalse: colors.surface,
    trackColorTrue: 'rgba(99, 102, 241, 0.4)',
    thumbColorActive: colors.primary,
    thumbColorInactive: colors.borderGray,
  },
}: SettingsSectionProps) {
  const renderItem = (item: SettingsItem, index: number, array: SettingsItem[]) => {
    const {
      label,
      description,
      icon: Icon,
      key,
      value,
      onPress,
      onValueChange,
      disabled = false,
      type = value !== undefined ? 'toggle' : onPress ? 'navigation' : 'action',
    } = item;

    const isLastItem = index === array.length - 1;
    const itemClassName = `flex-row items-center py-4 ${
      !isLastItem ? 'border-b border-white/10' : ''
    } ${disabled ? 'opacity-50' : ''} ${itemStyle || ''}`;

    const content = (
      <>
        {Icon && (
          <View className={iconContainerStyle}>
            <Icon size={iconSize} color={iconColor} />
          </View>
        )}
        <View className={Icon ? 'flex-1 mr-4' : 'flex-1 mr-4'}>
          <Text className="text-textPrimary text-base font-medium mb-1">{label}</Text>
          {description && <Text className="text-textSecondary text-sm">{description}</Text>}
        </View>
        {type === 'toggle' && (
          <Switch
            trackColor={{
              false: switchColors.trackColorFalse,
              true: switchColors.trackColorTrue,
            }}
            thumbColor={value ? switchColors.thumbColorActive : switchColors.thumbColorInactive}
            value={value}
            disabled={disabled}
            onValueChange={onValueChange}
            style={{
              transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
            }}
          />
        )}
        {(type === 'navigation' || type === 'action') && (
          <CaretRight size={20} color={colors.textSecondary} weight="bold" />
        )}
      </>
    );

    if (type === 'toggle') {
      return (
        <View key={key || index} className={itemClassName}>
          {content}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={key || index}
        className={itemClassName}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return <View className={containerStyle}>{items.map(renderItem)}</View>;
}
