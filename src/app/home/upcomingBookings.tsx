import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { Text, View } from 'react-native';

export const UpcomingBooking = () => (
  <View className="bg-surface rounded-xl mt-4 flex-row overflow-hidden">
    <View className="w-1 bg-primary" />
    <View className="p-4 flex-1">
      <Text className="text-base font-bold text-textPrimary mb-3">CrossFit Fundamentals</Text>
      <View className="space-y-2">
        <View className="flex-row items-center space-x-2">
          <MapPin size={16} color="#A0A0A0" />
          <Text className="text-sm text-textSecondary">CrossFit Central</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <Calendar size={16} color="#A0A0A0" />
          <Text className="text-sm text-textSecondary">Today</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <Clock size={16} color="#A0A0A0" />
          <Text className="text-sm text-textSecondary">6:30 PM - 7:30 PM</Text>
        </View>
      </View>
    </View>
  </View>
);
