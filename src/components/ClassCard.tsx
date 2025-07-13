import { Activity, Clock } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ClassCardProps {
  name: string;
  facility: string;
  image: string;
  time: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  spots: number;
  onPress: () => void;
  compact?: boolean;
}

export function ClassCard({
  name,
  facility,
  image,
  time,
  duration,
  intensity,
  spots,
  onPress,
  compact = false,
}: ClassCardProps) {
  const getIntensityColor = () => {
    switch (intensity) {
      case 'Low':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'High':
        return '#F44336';
      default:
        return '#A0A0A0';
    }
  };

  return (
    <TouchableOpacity
      className={`rounded-2xl overflow-hidden bg-zinc-900 ${compact ? 'w-44' : 'w-56'}`}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: image }} className="w-full h-24 opacity-80" />
      <View className="p-3">
        <Text className="text-base font-bold text-white mb-1">{name}</Text>
        {!compact && <Text className="text-xs text-gray-400 mb-2">{facility}</Text>}
        <View className="gap-1.5 mb-3">
          <View className="flex-row items-center gap-1.5">
            <Clock size={12} color="#A0A0A0" />
            <Text className="text-xs text-gray-400">{time}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Activity size={12} color={getIntensityColor()} />
            <Text style={{ color: getIntensityColor() }} className="text-xs font-normal">{intensity}</Text>
          </View>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="px-2 py-1 bg-indigo-500/10 rounded-xl">
            <Text className="text-xs text-indigo-500 font-medium">{spots} spots left</Text>
          </View>
          {!compact && (
            <TouchableOpacity className="px-3 py-1.5 bg-indigo-500 rounded-xl" onPress={onPress}>
              <Text className="text-xs font-bold text-white">Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}