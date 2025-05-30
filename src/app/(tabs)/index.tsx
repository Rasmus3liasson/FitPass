import { ClassCard } from '@/components/ClassCard';
import { FacilityCard } from '@/components/FacilityCard';
import { ProgressCircle } from '@/components/ProgressCircle';
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { Section } from '@/components/Section';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Calendar, Clock, MapPin } from 'lucide-react-native';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center px-4 py-4">
          <View>
            <Text className="text-base text-textSecondary">Welcome back,</Text>
            <Text className="text-2xl font-bold text-textPrimary">Alex</Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary"
            onPress={() => router.push('/profile')}
          >
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg' }}
              className="w-full h-full"
            />
          </TouchableOpacity>
        </View>

        <View className="bg-surface rounded-2xl px-5 py-6 mx-4 mb-6">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-textPrimary">Monthly Credits</Text>
            <Text className="text-sm text-textSecondary">June 2025</Text>
          </View>
          <View className="flex-row items-center">
            <ProgressCircle 
              percentage={65} 
              radius={40} 
              strokeWidth={8}
              color="#6366F1"
              textColor="#FFFFFF"
            />
            <View className="flex-1 ml-5">
              <View className="mb-3">
                <Text className="text-lg font-bold text-textPrimary mb-1">13/20</Text>
                <Text className="text-sm text-textSecondary">Credits Left</Text>
              </View>
              <View>
                <Text className="text-lg font-bold text-textPrimary mb-1">7</Text>
                <Text className="text-sm text-textSecondary">Visits Made</Text>
              </View>
            </View>
          </View>
        </View>

        <Section title="Upcoming Bookings" actionText="View All">
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
        </Section>

        <Section title="Nearby Facilities" description="Check out these locations close to you" actionText="View Map" onAction={() => router.push('/map')}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <FacilityCard
              name="PowerFit Gym"
              type="Gym"
              image="https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg"
              rating={4.8}
              distance="0.8 mi"
              openNow={true}
              onPress={() => router.push('/facility/powerfit')}
            />
            <FacilityCard
              name="AquaLife Center"
              type="Swimming"
              image="https://images.pexels.com/photos/261185/pexels-photo-261185.jpeg"
              rating={4.6}
              distance="1.2 mi"
              openNow={true}
              onPress={() => router.push('/facility/aqualife')}
            />
            <FacilityCard
              name="Boulder Zone"
              type="Climbing"
              image="https://images.pexels.com/photos/449609/pexels-photo-449609.jpeg"
              rating={4.9}
              distance="2.3 mi"
              openNow={false}
              onPress={() => router.push('/facility/boulder')}
            />
          </ScrollView>
        </Section>

        <Section title="Trending Classes" description="Popular classes at partner facilities" actionText="Explore All">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <ClassCard
              name="HIIT Bootcamp"
              facility="FitZone Central"
              image="https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg"
              time="5:30 PM"
              duration="45 min"
              intensity="High" 
              spots={0} 
              onPress={() => {}}
            />
            <ClassCard
              name="Power Yoga"
              facility="Zen Studio"
              image="https://images.pexels.com/photos/1812964/pexels-photo-1812964.jpeg"
              time="7:00 PM"
              duration="60 min"
              intensity="Medium" 
              spots={0} 
              onPress={() => {}}
            />
            <ClassCard
              name="Spin Class"
              facility="Cycle House"
              image="https://images.pexels.com/photos/4162587/pexels-photo-4162587.jpeg"
              time="6:15 AM"
              duration="45 min"
              intensity="High" 
              spots={0} 
              onPress={() => {}}
            />
          </ScrollView>
        </Section>

        <TouchableOpacity className="bg-surface rounded-2xl overflow-hidden mx-4 mt-6 mb-8 flex-row">
          <View className="flex-3 p-4">
            <Text className="text-xs text-primary font-bold mb-2">LIMITED TIME</Text>
            <Text className="text-lg font-bold text-textPrimary mb-2">Summer Promo: 20% Off Upgrades</Text>
            <Text className="text-sm text-textSecondary mb-4">Upgrade your plan and get 4 extra credits this month</Text>
            <View className="flex-row items-center space-x-2">
              <Text className="text-sm font-semibold text-textPrimary">Learn More</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </View>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/136404/pexels-photo-136404.jpeg' }}
            className="flex-2"
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
