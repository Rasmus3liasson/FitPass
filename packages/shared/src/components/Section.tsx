import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SectionProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function Section({ title, description, actionText, onAction, children }: SectionProps) {
  return (
    <View className="px-6 mb-8">
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-1">
          <Text className="text-textPrimary font-bold text-2xl mb-2">{title}</Text>
          {description && (
            <Text className="text-textSecondary text-base opacity-80 leading-relaxed">
              {description}
            </Text>
          )}
        </View>
        {actionText && onAction && (
          <TouchableOpacity
            onPress={onAction}
            className="bg-primary/20 px-4 py-2 rounded-full border border-primary/30 ml-4"
          >
            <Text className="text-textPrimary text-sm font-bold">{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View>{children}</View>
    </View>
  );
}
