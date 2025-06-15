import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { ActivityCard } from "@/components/ActivityCard";
import { BarChart } from "@/components/BarChart";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/hooks/useAuth";
import { getRecentVisits } from "@/lib/integrations/supabase/queries/visitQueries";
import { Visit } from "@/types";
import { useRouter } from "expo-router";

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user, timeRange]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const data = await getRecentVisits(user!.id);
      setVisits(data);
    } catch (error) {
      console.error("Error fetching visits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalVisits = visits.length;
  const uniqueClubs = new Set(visits.map(visit => visit.club_id)).size;
  const totalHours = visits.length; // Assuming 1 hour per visit

  // Process data for chart
  const processChartData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = Array(7).fill(0);

    visits.forEach((visit) => {
      const visitDate = new Date(visit.visit_date);
      const dayIndex = visitDate.getDay();
      // Convert Sunday (0) to index 6, and shift other days back by 1
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      data[adjustedIndex]++;
    });

    return days.map((label, index) => ({
      label,
      value: data[index],
    }));
  };

  const chartData = processChartData();

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <Text className="text-white font-bold text-2xl mb-6">Statistics</Text>

          {/* Time Range Selector */}
          <View className="flex-row bg-surface rounded-xl p-1 mb-6">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                timeRange === "week" ? "bg-primary" : ""
              }`}
              onPress={() => setTimeRange("week")}
            >
              <Text
                className={`text-center font-semibold ${
                  timeRange === "week" ? "text-white" : "text-textSecondary"
                }`}
              >
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg ${
                timeRange === "month" ? "bg-primary" : ""
              }`}
              onPress={() => setTimeRange("month")}
            >
              <Text
                className={`text-center font-semibold ${
                  timeRange === "month" ? "text-white" : "text-textSecondary"
                }`}
              >
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-surface rounded-xl p-4 flex-1 mr-2">
              <Text className="text-textSecondary text-sm mb-1">Total Visits</Text>
              <Text className="text-white font-bold text-2xl">{totalVisits}</Text>
            </View>
            <View className="bg-surface rounded-xl p-4 flex-1 mx-2">
              <Text className="text-textSecondary text-sm mb-1">Unique Clubs</Text>
              <Text className="text-white font-bold text-2xl">{uniqueClubs}</Text>
            </View>
            <View className="bg-surface rounded-xl p-4 flex-1 ml-2">
              <Text className="text-textSecondary text-sm mb-1">Hours Active</Text>
              <Text className="text-white font-bold text-2xl">{totalHours}</Text>
            </View>
          </View>

          {/* Activity Chart */}
          <View className="bg-surface rounded-xl p-4 mb-6">
            <Text className="text-white font-bold text-lg mb-4">Activity</Text>
            <BarChart
              data={chartData}
              width={Dimensions.get("window").width - 48}
              height={220}
            />
          </View>

          {/* Recent Activity */}
          <View className="mb-6">
            <Text className="text-white font-bold text-lg mb-4">Recent Activity</Text>
            {visits.map((visit) => (
              <ActivityCard
                key={visit.id}
                facilityName={visit.clubs?.name || "Unknown Facility"}
                activityType={visit.clubs?.type || "Unknown Type"}
                date={new Date(visit.visit_date).toLocaleDateString()}
                time={new Date(visit.visit_date).toLocaleTimeString()}
                duration="1 hour"
                credits={visit.credits_used}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
