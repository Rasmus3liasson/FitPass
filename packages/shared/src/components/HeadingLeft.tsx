import { Text, View } from 'react-native';

interface HeadingLeftI {
  title: string;
  subtitle?: string;
}

export default function HeadingLeft({ title, subtitle }: HeadingLeftI) {
  return (
    <View className="px-4 py-4">
      <Text className="text-3xl font-bold text-textPrimary mb-1">{title}</Text>
      <Text className="text-base text-textSecondary">{subtitle}</Text>
    </View>
  );
}
