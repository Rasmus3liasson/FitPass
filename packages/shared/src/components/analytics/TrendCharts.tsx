import colors from '@shared/constants/custom-colors';
import { Section } from '../Section';
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
  const periodLabel =
    selectedPeriod === 'week'
      ? 'Daglig'
      : selectedPeriod === 'month'
        ? 'Veckovis'
        : selectedPeriod === 'quarter'
          ? 'Månadsvis'
          : 'Kvartalsvis';

  return (
    <Section title="Trender" description={`${periodLabel} prestationsöversikt`}>
      <TrendChart
        data={dailyVisitData}
        title="Besöksaktivitet"
        color={colors.primary}
        height={140}
      />

      <TrendChart
        data={trendData.map((d) => ({ date: d.date, value: d.visits }))}
        title={`${periodLabel} besök`}
        color={colors.accentGreen}
        height={140}
      />

      <TrendChart
        data={trendData.map((d) => ({ date: d.date, value: d.revenue }))}
        title={`${periodLabel} intäkter`}
        color={colors.accentYellow}
        height={140}
      />
    </Section>
  );
};
