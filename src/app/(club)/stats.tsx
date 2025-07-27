import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { MonthlyBreakdown } from "@/src/components/analytics/MonthlyBreakdown";
import { PerformanceInsights } from "@/src/components/analytics/PerformanceInsights";
import { RecentActivity } from "@/src/components/analytics/RecentActivity";
import {
  StatsCard,
  TimePeriodSelector,
} from "@/src/components/analytics/StatsComponents";
import { TrendCharts } from "@/src/components/analytics/TrendCharts";
import { useAuth } from "@/src/hooks/useAuth";
import {
  useClubBookings,
  useClubRevenue,
  useClubReviews,
  useClubVisits,
} from "@/src/hooks/useClubAnalytics";
import { useClubByUserId } from "@/src/hooks/useClubs";
import { calculateAnalyticsMetrics } from "@/src/utils/analyticsUtils";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  CreditCard,
  Eye,
  MapPin,
  Star,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function ClubStatsScreen() {
  const { user } = useAuth();
  const { data: club, isLoading: clubLoading } = useClubByUserId(
    user?.id || ""
  );
  const { data: visits, isLoading: visitsLoading } = useClubVisits(
    club?.id || ""
  );
  const { data: bookings, isLoading: bookingsLoading } = useClubBookings(
    club?.id || ""
  );
  const { data: reviews, isLoading: reviewsLoading } = useClubReviews(
    club?.id || ""
  );
  const { data: revenueData, isLoading: revenueLoading } = useClubRevenue(
    club?.id || ""
  );

  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  const isLoading =
    clubLoading ||
    visitsLoading ||
    bookingsLoading ||
    reviewsLoading ||
    revenueLoading;

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-white mt-4 text-base">
            Loading analytics...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!club) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background p-6">
          <MapPin size={48} color="#A0A0A0" />
          <Text className="text-white text-xl font-semibold mt-4 text-center">
            No Club Found
          </Text>
          <Text className="text-textSecondary text-center mt-2">
            You need to create a club first to view analytics
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const metrics = calculateAnalyticsMetrics(
    visits || [],
    bookings || [],
    reviews || [],
    revenueData,
    selectedPeriod,
    club.avg_rating
  );

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-white text-2xl font-bold">Analytics</Text>
          <Text className="text-textSecondary text-base mt-1">{club.name}</Text>
        </View>

        {/* Time Period Selector */}
        <View className="px-6">
          <TimePeriodSelector
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
          />
        </View>

        {/* Key Metrics Grid */}
        <View className="px-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Key Metrics
          </Text>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <StatsCard
                title="Total Visits"
                value={metrics.totalVisits}
                subtitle={`${metrics.currentVisits.length} this ${selectedPeriod}`}
                icon={<Eye size={20} color="#6366F1" />}
                trend={metrics.visitsTrend}
                colorClass="bg-primary"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatsCard
                title="Revenue"
                value={`${metrics.estimatedRevenue} SEK`}
                subtitle={`${metrics.currentPeriodRevenue} SEK this ${selectedPeriod}`}
                icon={<CreditCard size={20} color="#4CAF50" />}
                trend={metrics.revenueTrend}
                colorClass="bg-accentGreen"
              />
            </View>
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <StatsCard
                title="Bookings"
                value={metrics.totalBookings}
                subtitle={`${metrics.currentBookings.length} this ${selectedPeriod}`}
                icon={<Calendar size={20} color="#FFC107" />}
                trend={metrics.bookingsTrend}
                colorClass="bg-intensityMedium"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatsCard
                title="Avg Rating"
                value={metrics.averageRating}
                subtitle={`${reviews?.length || 0} reviews`}
                icon={<Star size={20} color="#F44336" />}
                colorClass="bg-accentRed"
              />
            </View>
          </View>

          <StatsCard
            title="Unique Visitors"
            value={metrics.uniqueVisitors}
            subtitle={
              metrics.topDay
                ? `Peak day: ${metrics.topDay[0]} (${metrics.topDay[1]} visits)`
                : "No peak day data"
            }
            icon={<Users size={20} color="#8B5CF6" />}
            colorClass="bg-accentPurple"
          />
        </View>

        {/* Trend Charts */}
        <TrendCharts
          dailyVisitData={metrics.dailyVisitData}
          trendData={metrics.trendData}
          selectedPeriod={selectedPeriod}
        />

        {/* Recent Activity */}
        <RecentActivity
          currentVisits={metrics.currentVisits}
          revenueData={revenueData}
        />

        {/* Performance Insights */}
        <PerformanceInsights
          uniqueVisitors={metrics.uniqueVisitors}
          totalVisits={metrics.totalVisits}
          totalBookings={metrics.totalBookings}
          revenueData={revenueData}
        />

        {/* Monthly Breakdown */}
        <MonthlyBreakdown visits={visits || []} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
