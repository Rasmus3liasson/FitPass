import { Section } from '@/src/components/Section';
import React from 'react';
import { TrendChart } from './TrendChart';

interface TrendChartsProps {
  dailyVisitData: { date: string; value: number }[];
  trendData: { date: string; visits: number; bookings: number; revenue: number }[];
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year';
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  dailyVisitData,
  trendData,
  selectedPeriod,
}) => {
  const periodLabel = selectedPeriod === 'week' ? 'Daily' : 
                     selectedPeriod === 'month' ? 'Weekly' :
                     selectedPeriod === 'quarter' ? 'Monthly' : 'Quarterly';

  return (
    <Section 
      title="Trends" 
      description={`${periodLabel} performance overview`}
    >
      <TrendChart
        data={dailyVisitData}
        title="Visit Activity"
        color="#6366F1"
        height={140}
      />
      
      <TrendChart
        data={trendData.map(d => ({ date: d.date, value: d.visits }))}
        title={`${periodLabel} Visits`}
        color="#10B981"
        height={140}
      />
      
      <TrendChart
        data={trendData.map(d => ({ date: d.date, value: d.revenue }))}
        title={`${periodLabel} Revenue`}
        color="#F59E0B"
        height={140}
      />
    </Section>
  );
};
