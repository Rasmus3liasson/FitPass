import { StatusBar } from 'expo-status-bar';
import { Award, Calendar, Clock, MapPin, TrendingUp, User } from 'lucide-react-native';
import { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { ActivityCard } from '@/components/ActivityCard';
import { BarChart } from '@/components/BarChart';
import { ProgressCircle } from '@/components/ProgressCircle';
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { Section } from '@/components/Section';

export default function StatsScreen() {
  const [timeRange, setTimeRange] = useState('month');
  const monthData = [
    { label: 'Week 1', value: 3 },
    { label: 'Week 2', value: 5 },
    { label: 'Week 3', value: 2 },
    { label: 'Week 4', value: 4 },
  ];
  const weekData = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 1 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 1 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 1 },
  ];
  const chartData = timeRange === 'month' ? monthData : weekData;
  const windowWidth = Dimensions.get('window').width;

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4">
          <Text className="text-white text-2xl font-bold">Your Stats</Text>
          <View className="flex-row bg-surface rounded-full p-1">
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${timeRange === 'week' ? 'bg-primary' : ''}`}
              onPress={() => setTimeRange('week')}
            >
              <Text className={`text-sm ${timeRange === 'week' ? 'text-white font-semibold' : 'text-textSecondary'}`}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${timeRange === 'month' ? 'bg-primary' : ''}`}
              onPress={() => setTimeRange('month')}
            >
              <Text className={`text-sm ${timeRange === 'month' ? 'text-white font-semibold' : 'text-textSecondary'}`}>
                Month
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between px-4 mb-6">
          {[ 
            { icon: <Award size={20} color="#6366F1" />, title: 'Total Visits', value: '14' },
            { icon: <MapPin size={20} color="#6366F1" />, title: 'Places Visited', value: '5' },
            { icon: <Clock size={20} color="#6366F1" />, title: 'Hours Active', value: '18.5' },
          ].map(({ icon, title, value }, i) => (
            <View key={i} className="bg-surface rounded-xl p-4 w-[30%] items-center">
              <View className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                {icon}
              </View>
              <Text className="text-textSecondary text-xs mb-1 text-center">{title}</Text>
              <Text className="text-white text-lg font-bold">{value}</Text>
            </View>
          ))}
        </View>

        {/* Usage Summary Section */}
        <Section title="Usage Summary">
          <View className="bg-surface rounded-xl p-4 mt-4">
            <View className="items-center mb-6">
              <ProgressCircle
                percentage={70}
                radius={60}
                strokeWidth={10}
                color="#6366F1"
                textColor="#FFFFFF"
              />
              <View className="items-center mt-4">
                <Text className="text-textSecondary text-sm mb-1">Credits Used</Text>
                <Text className="text-white text-lg font-bold">14/20</Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="w-[48%]">
                <View className="flex-row items-center mb-2 space-x-2">
                  <TrendingUp size={16} color="#A0A0A0" />
                  <Text className="text-textSecondary text-sm">vs. Last Month</Text>
                </View>
                <Text className="text-white text-lg font-bold">+28%</Text>
              </View>

              <View className="w-[48%]">
                <View className="flex-row items-center mb-2 space-x-2">
                  <User size={16} color="#A0A0A0" />
                  <Text className="text-textSecondary text-sm">Member Average</Text>
                </View>
                <Text className="text-white text-lg font-bold">12 visits</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* Activity History */}
        <Section title="Activity History">
          <View className="mt-4 items-center">
            <BarChart 
              data={chartData} 
              width={windowWidth - 40} 
              height={200} 
            />
          </View>
        </Section>

        {/* Recent Activity */}
        <Section title="Recent Activity">
          <ActivityCard
            facilityName="PowerFit Gym"
            activityType="Strength Training"
            date="Today"
            time="6:30 PM - 7:45 PM"
            duration="1h 15m"
            credits={1}
          />
          <ActivityCard
            facilityName="AquaLife Center"
            activityType="Swimming"
            date="Yesterday"
            time="8:00 AM - 9:00 AM"
            duration="1h"
            credits={1}
          />
          <ActivityCard
            facilityName="CrossFit Central"
            activityType="CrossFit Class"
            date="June 8"
            time="5:30 PM - 6:30 PM"
            duration="1h"
            credits={2}
          />
        </Section>

        {/* Achievements */}
        <Section 
          title="Achievements" 
          actionText="View All"
          onAction={() => {/* Navigate to all achievements */}}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 16, gap: 16 }}
          >
            {/* Achievement Items */}
            <View className="bg-surface rounded-xl p-4 w-30 items-center">
              <View className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-3">
                <Award size={32} color="#FFFFFF" />
              </View>
              <Text className="text-white text-sm font-semibold mb-1">First Visit</Text>
              <Text className="text-textSecondary text-xs text-center">Earned May 12</Text>
            </View>

            <View className="bg-surface rounded-xl p-4 w-30 items-center">
              <View className="w-16 h-16 rounded-full bg-pinkAccent flex items-center justify-center mb-3">
                <MapPin size={32} color="#FFFFFF" />
              </View>
              <Text className="text-white text-sm font-semibold mb-1">Explorer</Text>
              <Text className="text-textSecondary text-xs text-center">3 different venues</Text>
            </View>

            <View className="bg-surface rounded-xl p-4 w-30 items-center opacity-60">
              <View className="w-16 h-16 rounded-full bg-darkGray flex items-center justify-center mb-3">
                <Calendar size={32} color="#777777" />
              </View>
              <Text className="text-lockedGray text-sm font-semibold mb-1">Consistent</Text>
              <Text className="text-textSecondary text-xs text-center">Visit 5 weeks in a row</Text>
            </View>
          </ScrollView>
        </Section>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
