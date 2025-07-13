import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/src/hooks/useAuth";

import { Section } from "@/src/components/Section";
import { useClubByUserId } from "@/src/hooks/useClubs";
import { supabase } from "@/src/lib/integrations/supabase/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Define getClubVisits and useClubVisits here or import from hooks/queries

export async function getClubVisits(clubId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("club_id", clubId);
  if (error) throw error;
  return data;
}

export const useClubVisits = (clubId: string) => {
  return useQuery({
    queryKey: ["clubVisits", clubId],
    queryFn: () => getClubVisits(clubId),
    enabled: !!clubId,
  });
};

export default function ClubStatsScreen() {
  const { user } = useAuth();
  const { data: club } = useClubByUserId(user?.id || "");
  const { data: visits, isLoading } = useClubVisits(club?.id || "");

  if (isLoading) {
    return <Text className="text-white">Loading...</Text>;
  }

  // Calculate stats
  const totalVisits = visits?.length || 0;
  const uniqueVisitors = new Set(visits?.map((v) => v.user_id)).size;
  const now = new Date();
  const oneMonthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate()
  );
  const visitsLastMonth =
    visits?.filter((v) => new Date(v.created_at) > oneMonthAgo).length || 0;

  // Visits per month for the last 12 months
  const visitsByMonth: { [month: string]: number } = {};
  visits?.forEach((v) => {
    const d = new Date(v.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    visitsByMonth[key] = (visitsByMonth[key] || 0) + 1;
  });

  // Top users
  const userVisitCounts: { [userId: string]: number } = {};
  visits?.forEach((v) => {
    userVisitCounts[v.user_id] = (userVisitCounts[v.user_id] || 0) + 1;
  });
  const topUsers = Object.entries(userVisitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "#18181b", padding: 16 }}>
        <Text style={styles.header}>Club Visit Stats</Text>
        {(!visits || visits.length === 0) ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-lg mt-8">No visits yet.</Text>
          </View>
        ) : (
          <>
            <Section title="Overview">
              <View className="flex-row justify-between mb-6">
                <View className="bg-surface rounded-xl p-4 flex-1 mr-2">
                  <Text className="text-textSecondary text-sm mb-1">
                    Total Visits
                  </Text>
                  <Text className="text-white font-bold text-2xl">
                    {totalVisits}
                  </Text>
                </View>
                <View className="bg-surface rounded-xl p-4 flex-1 mx-2">
                  <Text className="text-textSecondary text-sm mb-1">
                    Unique Visitors
                  </Text>
                  <Text className="text-white font-bold text-2xl">
                    {uniqueVisitors}
                  </Text>
                </View>
                <View className="bg-surface rounded-xl p-4 flex-1 ml-2">
                  <Text className="text-textSecondary text-sm mb-1">
                    Visits Last Month
                  </Text>
                  <Text className="text-white font-bold text-2xl">
                    {visitsLastMonth}
                  </Text>
                </View>
              </View>
            </Section>
            <Section title="Visits by Month">
              {/* BarChart component would go here if available */}
              {/* For now, just display the data */}
              {Object.entries(visitsByMonth).map(([month, count]) => (
                <Text key={month} style={styles.text}>
                  {month}: {count}
                </Text>
              ))}
            </Section>
            <Section title="Top Users">
              {topUsers.map(([userId, count]) => (
                <View key={userId} className="bg-surface rounded-xl p-4 mb-2">
                  <Text className="text-white font-bold">{userId}</Text>
                  <Text className="text-textSecondary">{count} visits</Text>
                </View>
              ))}
            </Section>
          </>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18181b",
    padding: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  text: { color: "#fff", fontSize: 16, textAlign: "center" },
});
