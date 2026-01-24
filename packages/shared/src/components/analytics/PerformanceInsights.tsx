import colors from '@shared/constants/custom-colors';
import { Section } from '../Section';
import { TrendUp } from 'phosphor-react-native';
import React from 'react';
import { Text, View } from 'react-native';

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
  revenueData,
}) => (
  <Section title="Insikter" description="Viktiga prestationsindikatorer">
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-textPrimary text-lg font-semibold">Prestanda</Text>
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <TrendUp size={16} color={colors.primary} />
        </View>
      </View>

      <View className="space-y-3">
        <View className="flex-row items-center justify-between py-2 border-b border-accentGray">
          <Text className="text-textSecondary">Besöksfrekvens</Text>
          <Text className="text-textPrimary font-medium">
            {uniqueVisitors > 0 ? (totalVisits / uniqueVisitors).toFixed(1) : '0.0'} besök/användare
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2 border-b border-accentGray">
          <Text className="text-textSecondary">Bokningsfrekvens</Text>
          <Text className="text-textPrimary font-medium">
            {totalVisits > 0 ? ((totalBookings / totalVisits) * 100).toFixed(1) : '0.0'}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <Text className="text-textSecondary">Intäkt per besök</Text>
          <Text className="text-textPrimary font-medium">{revenueData?.pricePerVisit} SEK</Text>
        </View>
      </View>
    </View>
  </Section>
);
