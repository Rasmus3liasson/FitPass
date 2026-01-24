import colors from '@shared/constants/custom-colors';
import { Clock } from 'phosphor-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { formatSwedishTime } from '../../utils/time';
import { Section } from '../Section';

interface RecentActivityProps {
  currentVisits: any[];
  revenueData: any;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ currentVisits, revenueData }) => (
  <Section title="Senaste Aktivitet" description="Senaste besök och bokningar">
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4 justify-between">
        <Text className="text-textPrimary text-lg font-semibold">Senaste Besök</Text>
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
          <Clock size={16} color={colors.primary} />
        </View>
      </View>

      {currentVisits.length === 0 ? (
        <Text className="text-textSecondary text-center py-4">Inga besök under vald period</Text>
      ) : (
        currentVisits.slice(0, 5).map((visit) => (
          <View key={visit.id} className="flex-row items-center justify-between py-2">
            <View className="flex-1">
              <Text className="text-textPrimary font-medium">
                {visit.users?.email?.split('@')[0] || 'Anonym'}
              </Text>
              <Text className="text-textSecondary text-sm">
                {formatSwedishTime(visit.created_at, true)}
              </Text>
            </View>
            <View className="bg-primary/20 px-2 py-1 rounded-full">
              <Text className="text-textPrimary text-xs font-medium">
                +{revenueData?.creditsPerVisit || 1} krediter
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  </Section>
);
