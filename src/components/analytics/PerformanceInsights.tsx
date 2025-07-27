import { Section } from "@/src/components/Section";
import { TrendingUp } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface PerformanceInsightsProps {
  uniqueVisitors: number;
  totalVisits: number;
  totalBookings: number;
  revenueData: any;
}

export const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({
  uniqueVisitors,
  totalVisits,
  totalBookings,
  revenueData
}) => (
  <Section title="Insights" description="Key performance indicators">
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <TrendingUp size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Performance</Text>
      </View>

      <View className="space-y-3">
        <View className="flex-row items-center justify-between py-2 border-b border-accentGray">
          <Text className="text-textSecondary">Visit Frequency</Text>
          <Text className="text-white font-medium">
            {uniqueVisitors > 0 ? (totalVisits / uniqueVisitors).toFixed(1) : '0.0'} visits/user
          </Text>
        </View>
        
        <View className="flex-row items-center justify-between py-2 border-b border-accentGray">
          <Text className="text-textSecondary">Booking Rate</Text>
          <Text className="text-white font-medium">
            {totalVisits > 0 ? ((totalBookings / totalVisits) * 100).toFixed(1) : '0.0'}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <Text className="text-textSecondary">Revenue per Visit</Text>
          <Text className="text-white font-medium">
            {(revenueData?.creditsPerVisit || 1) * 10} SEK
          </Text>
        </View>
      </View>
    </View>
  </Section>
);
