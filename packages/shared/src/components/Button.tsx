import { router } from 'expo-router';
import { CaretLeft, XIcon } from 'phosphor-react-native';
import { ReactNode } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/custom-colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const getButtonClass = () => {
    if (disabled) return 'bg-zinc-700 opacity-60';
    switch (variant) {
      case 'secondary':
        return 'bg-surface';
      case 'outline':
        return 'bg-transparent border border-primary';
      default:
        return 'bg-primary';
    }
  };

  const getTextClass = () => {
    if (typeof style === 'string' && style.includes('border-red-500')) {
      return 'text-accentRed';
    }
    switch (variant) {
      case 'outline':
        return 'text-accentRed';
      case 'secondary':
      case 'primary':
      default:
        return 'text-textPrimary';
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-xl py-3 px-5 items-center justify-center ${getButtonClass()} ${
        style || ''
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
          <Text className={`font-semibold text-base ${getTextClass()}`}>{title}</Text>
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
          router.replace('/');
        }
      }}
      activeOpacity={0.8}
    >
      <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
    </TouchableOpacity>
  );
}

interface AuthBackButtonProps extends Pick<ButtonProps, 'onPress' | 'disabled'> {}

export function AuthBackButton({ onPress, disabled = false }: AuthBackButtonProps) {
  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <CaretLeft size={24} color={colors.textPrimary} weight="bold" />
    </TouchableOpacity>
  );
}

export function CloseButton({ onPress, disabled = false }: AuthBackButtonProps) {
  return (
    <TouchableOpacity
      className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <XIcon size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
