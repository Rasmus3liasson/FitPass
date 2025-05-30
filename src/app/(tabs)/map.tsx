import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Filter, MapPin, Star, X } from 'lucide-react-native';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { FilterChip } from '@/components/FilterChip';
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';

// Placeholder for the actual map - in real app, use react-native-maps
const MapPlaceholder = () => (
  <View className="flex-1 relative">
    <Image 
      source={{ uri: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg' }}
      className="w-full h-full"
    />
    <View className="absolute inset-0 bg-black/20" />
    {/* Fake map pins */}
    <View className="absolute" style={{ top: '30%', left: '45%', transform: [{ translateX: -14 }, { translateY: -28 }] }}>
      <MapPin size={28} color="#6366F1" />
    </View>
    <View className="absolute" style={{ top: '40%', left: '65%', transform: [{ translateX: -14 }, { translateY: -28 }] }}>
      <MapPin size={28} color="#6366F1" />
    </View>
    <View className="absolute" style={{ top: '55%', left: '25%', transform: [{ translateX: -14 }, { translateY: -28 }] }}>
      <MapPin size={28} color="#6366F1" />
    </View>
    <View className="absolute" style={{ top: '60%', left: '55%', transform: [{ translateX: -14 }, { translateY: -28 }] }}>
      <MapPin size={28} color="#6366F1" />
    </View>
    <View className="absolute" style={{ top: '25%', left: '75%', transform: [{ translateX: -14 }, { translateY: -28 }] }}>
      <MapPin size={28} color="#6366F1" />
    </View>
  </View>
);

export default function MapScreen() {
  const router = useRouter();
  const windowHeight = Dimensions.get('window').height;

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3">
          <View className="flex-row items-center bg-surface rounded-full px-3 py-2 space-x-2">
            <MapPin size={16} color="#6366F1" />
            <Text className="text-textPrimary text-sm font-medium">Current Location</Text>
            <ChevronDown size={16} color="#FFFFFF" />
          </View>
          <TouchableOpacity 
            className="bg-primary rounded-xl w-10 h-10 items-center justify-center"
            onPress={() => {/* Toggle filter modal */}}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View className="px-4 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 8 }}>
            <FilterChip label="All" selected={true} onPress={() => {}} />
            <FilterChip label="Gym" selected={false} onPress={() => {}} />
            <FilterChip label="Swimming" selected={false} onPress={() => {}} />
            <FilterChip label="Climbing" selected={false} onPress={() => {}} />
            <FilterChip label="CrossFit" selected={false} onPress={() => {}} />
            <FilterChip label="Yoga" selected={false} onPress={() => {}} />
          </ScrollView>
        </View>

        {/* Map */}
        <MapPlaceholder />

        {/* Facility Card */}
        <View
          className="absolute left-0 right-0 bg-surface rounded-t-2xl px-5 py-5"
          style={{ bottom: 0, height: windowHeight * 0.25 }}
        >
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
            onPress={() => {/* Close the facility card */}}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-row space-x-4">
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg' }}
              className="w-[110px] h-[140px] rounded-xl"
            />

            <View className="flex-1 justify-between">
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-primary text-sm font-semibold">Gym</Text>
                  <View className="flex-row items-center space-x-1">
                    <Star size={14} color="#FFCA28" fill="#FFCA28" />
                    <Text className="text-textPrimary text-sm font-semibold">4.8</Text>
                  </View>
                </View>
                <Text className="text-textPrimary text-xl font-bold mb-2">PowerFit Gym</Text>
                <View className="flex-row items-center space-x-1.5 mb-2">
                  <MapPin size={14} color="#A0A0A0" />
                  <Text className="text-textSecondary text-sm">0.8 miles away</Text>
                </View>
                <View className="flex-row items-center mb-4">
                  <View className="w-2 h-2 rounded-full bg-[#4CAF50] mr-1.5" />
                  <Text className="text-textPrimary text-sm font-medium">Open now</Text>
                  <Text className="text-textSecondary text-sm ml-1">• Until 10:00 PM</Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-xl py-2.5 items-center"
                onPress={() => router.push('/facility/powerfit')}
              >
                <Text className="text-textPrimary text-sm font-semibold">View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}