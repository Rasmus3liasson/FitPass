import { Section } from "@/src/components/Section";
import { BarChart3 } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface MonthlyBreakdownProps {
  visits: any[];
}

export const MonthlyBreakdown: React.FC<MonthlyBreakdownProps> = ({ visits }) => {
  if (!visits || visits.length === 0) return null;

  const monthlyData: { [month: string]: number } = {};
  visits.forEach(v => {
    const date = new Date(v.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  const sortedMonths = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);

  return (
    <Section title="Månadsöversikt" description="Besökstrender över tid">
      <View className="bg-surface rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
            <BarChart3 size={16} color="#6366F1" />
          </View>
          <Text className="text-white text-lg font-semibold">Senaste 6 månaderna</Text>
        </View>

        {sortedMonths.map(([month, count]) => {
          const [year, monthNum] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' });
          const maxCount = Math.max(...sortedMonths.map(([, c]) => c));
          const percentage = (count / maxCount) * 100;

          return (
            <View key={month} className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-textSecondary text-sm">{monthName}</Text>
                <Text className="text-white font-medium">{count}</Text>
              </View>
              <View className="bg-accentGray rounded-full h-2">
                <View 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${percentage}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
};
