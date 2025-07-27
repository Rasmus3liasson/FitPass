import { Section } from "@/src/components/Section";
import { formatSwedishTime } from "@/src/utils/time";
import { Clock } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface RecentActivityProps {
  currentVisits: any[];
  revenueData: any;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  currentVisits, 
  revenueData 
}) => (
  <Section title="Recent Activity" description="Latest visits and bookings">
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Clock size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Latest Visits</Text>
      </View>
      
      {currentVisits.length === 0 ? (
        <Text className="text-textSecondary text-center py-4">
          No visits in the selected period
        </Text>
      ) : (
        currentVisits.slice(0, 5).map((visit) => (
          <View key={visit.id} className="flex-row items-center justify-between py-2">
            <View className="flex-1">
              <Text className="text-white font-medium">
                {visit.users?.email?.split('@')[0] || 'Anonymous'}
              </Text>
              <Text className="text-textSecondary text-sm">
                {formatSwedishTime(visit.created_at, true)}
              </Text>
            </View>
            <View className="bg-primary/20 px-2 py-1 rounded-full">
              <Text className="text-primary text-xs font-medium">
                +{revenueData?.creditsPerVisit || 1} credits
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  </Section>
);
