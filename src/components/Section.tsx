import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SectionProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({
  title,
  description,
  actionText,
  onAction,
  children,
}: SectionProps) {
  return (
    <View className="px-4 mb-6">
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-lg font-bold text-white mb-1">{title}</Text>
          {description && <Text className="text-sm text-gray-400">{description}</Text>}
        </View>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction}>
            <Text className="text-sm text-indigo-500 font-semibold">{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View>
        {children}
      </View>
    </View>
  );
}