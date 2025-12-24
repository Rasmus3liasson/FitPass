import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { EarningsOverview } from "@shared/components/analytics/EarningsOverview";
import { InvoiceViewer } from "@shared/components/analytics/InvoiceViewer";
import { RecentActivity } from "@shared/components/analytics/RecentActivity";
import {
    StatsCard,
    TimePeriodSelector,
} from "@shared/components/analytics/StatsComponents";
import { TrendCharts } from "@shared/components/analytics/TrendCharts";
import { useAuth } from "@shared/hooks/useAuth";
import {
    useClubBookings,
    useClubRevenue,
    useClubReviews,
    useClubVisits,
} from "@shared/hooks/useClubAnalytics";
import { useClubByUserId } from "@shared/hooks/useClubs";
import { calculateAnalyticsMetrics } from "@shared/utils/analyticsUtils";
import { StatusBar } from "expo-status-bar";
import {
    Calendar,
    CreditCard,
    Eye,
    MapPin,
    Star,
    Users,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function ClubStatsScreen() {
  const { user } = useAuth();

  const {
    data: club,
    isLoading: clubLoading,
    refetch: refetchClub,
  } = useClubByUserId(user?.id || "");

  const {
    data: visits,
    isLoading: visitsLoading,
    refetch: refetchVisits,
  } = useClubVisits(club?.id || "");

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useClubBookings(club?.id || "");

  const {
    data: reviews,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useClubReviews(club?.id || "");

  const {
    data: revenueData,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useClubRevenue(club?.id || "");

  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  const [refreshing, setRefreshing] = useState(false);

  const isLoading =
    clubLoading ||
    visitsLoading ||
    bookingsLoading ||
    reviewsLoading ||
    revenueLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchClub(),
        refetchVisits(),
        refetchBookings(),
        refetchReviews(),
        refetchRevenue(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchClub,
    refetchVisits,
    refetchBookings,
    refetchReviews,
    refetchRevenue,
  ]);

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textPrimary mt-4 text-base">
            Laddar analyser...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!club) {
    return (
      <SafeAreaWrapper>
        <View className="px-6 py-6">
          <MapPin size={48} color="#A0A0A0" />
          <Text className="text-textPrimary text-xl font-semibold mt-4 text-center">
            Ingen Klubb Hittad
          </Text>
          <Text className="text-textSecondary text-center mt-2">
            Du behöver skapa en klubb först för att visa analyser
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

  console.log("Calculated Metrics:", selectedPeriod);
  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <PageHeader
        title="Analyser"
        subtitle={club.name}
      />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            title="Laddar..."
            titleColor="#6366F1"
          />
        }
      >

        {/* Time Period Selector */}
        <View className="px-6">
          <TimePeriodSelector
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
          />
        </View>

        {/* Key Metrics Grid */}
        <View className="px-6">
          <Text className="text-textPrimary text-lg font-semibold mb-4">
            Nyckeltal
          </Text>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <StatsCard
                title="Totala Besök"
                value={metrics.totalVisits}
                subtitle={`${metrics.currentVisits.length} denna ${
                  selectedPeriod === "week"
                    ? "vecka"
                    : selectedPeriod === "month"
                    ? "månad"
                    : selectedPeriod === "quarter"
                    ? "kvartal"
                    : "år"
                }`}
                icon={<Eye size={20} color="#6366F1" />}
                trend={metrics.visitsTrend}
                colorClass="bg-primary"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatsCard
                title="Intäkter"
                value={`${metrics.estimatedRevenue} SEK`}
                subtitle={`${metrics.currentPeriodRevenue} SEK denna ${
                  selectedPeriod === "week"
                    ? "vecka"
                    : selectedPeriod === "month"
                    ? "månad"
                    : selectedPeriod === "quarter"
                    ? "kvartal"
                    : "år"
                }`}
                icon={<CreditCard size={20} color="#4CAF50" />}
                trend={metrics.revenueTrend}
                colorClass="bg-accentGreen"
              />
            </View>
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <StatsCard
                title="Bokningar"
                value={metrics.totalBookings}
                subtitle={`${metrics.currentBookings.length} denna ${
                  selectedPeriod === "week"
                    ? "vecka"
                    : selectedPeriod === "month"
                    ? "månad"
                    : selectedPeriod === "quarter"
                    ? "kvartal"
                    : "år"
                }`}
                icon={<Calendar size={20} color="#FFC107" />}
                trend={metrics.bookingsTrend}
                colorClass="bg-intensityMedium"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatsCard
                title="Snittbetyg"
                value={metrics.averageRating}
                subtitle={`${reviews?.length || 0} recensioner`}
                icon={<Star size={20} color="#F44336" />}
                colorClass="bg-accentRed"
              />
            </View>
          </View>

          <StatsCard
            title="Unika Besökare"
            value={metrics.uniqueVisitors}
            subtitle={
              metrics.topDay
                ? `Toppdag: ${metrics.topDay[0]} (${metrics.topDay[1]} besök)`
                : "Ingen toppdagsdata"
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

        {/* Earnings Overview - Replaces PerformanceInsights */}
        <EarningsOverview clubId={club.id} selectedPeriod={selectedPeriod} />

        {/* Invoice Viewer - Replaces MonthlyBreakdown */}
        <InvoiceViewer clubId={club.id} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
