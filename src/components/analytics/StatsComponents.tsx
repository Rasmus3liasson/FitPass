import { ArrowDown, ArrowUp, Minus } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// Stats Card Component
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; trend: "up" | "down" | "neutral" };
  colorClass?: string;
  trendData?: number[];
}> = ({ title, value, subtitle, icon, trend, colorClass = "bg-primary" }) => (
  <View className="bg-surface rounded-2xl p-4 mb-4" style={{ minHeight: 100 }}>
    <View className="flex-row items-start justify-between mb-2">
      <View className="flex-1">
        <Text className="text-textSecondary text-sm">{title}</Text>
        <Text className="text-textPrimary font-bold text-2xl" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${colorClass}/20`}
      >
        {icon}
      </View>
    </View>
    {trend ? (
      <View className="flex-row items-center">
        <Text
          className={`text-sm font-medium mr-2 ${
            trend.trend === "up"
              ? "text-accentGreen"
              : trend.trend === "down"
              ? "text-accentRed"
              : "text-textSecondary"
          }`}
        >
          {trend.value.toFixed(1)}%{" "}
          {trend.trend === "up"
            ? "ökning"
            : trend.trend === "down"
            ? "minskning"
            : "ingen förändring"}
        </Text>
        {trend.trend === "up" && <ArrowUp size={14} color="#4CAF50" />}
        {trend.trend === "down" && <ArrowDown size={14} color="#F44336" />}
        {trend.trend === "neutral" && <Minus size={14} color="#A0A0A0" />}
      </View>
    ) : subtitle ? (
      <Text className="text-textSecondary text-xs">{subtitle}</Text>
    ) : null}
  </View>
);

// Time Period Selector
export const TimePeriodSelector: React.FC<{
  selected: "week" | "month" | "quarter" | "year";
  onSelect: (period: "week" | "month" | "quarter" | "year") => void;
}> = ({ selected, onSelect }) => (
  <View className="flex-row bg-surface rounded-xl p-1 mb-6">
    {(["week", "month", "quarter", "year"] as const).map((period) => (
      <TouchableOpacity
        key={period}
        className={`flex-1 py-2 px-3 rounded-lg ${
          selected === period ? "bg-primary" : "bg-transparent"
        }`}
        onPress={() => onSelect(period)}
      >
        <Text
          className={`text-center text-sm font-medium ${
            selected === period ? "text-textPrimary" : "text-textSecondary"
          }`}
        >
          {period === "week"
            ? "Vecka"
            : period === "month"
            ? "Månad"
            : period === "quarter"
            ? "Kvartal"
            : "År"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
