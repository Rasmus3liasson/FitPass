import { Text, TouchableOpacity } from 'react-native';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      className={`px-3 py-2 rounded-2xl border ${selected ? 'bg-indigo-500 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className={`text-sm ${selected ? 'text-textPrimary font-medium' : 'text-accentGray'}`}>{label}</Text>
    </TouchableOpacity>
  );
}