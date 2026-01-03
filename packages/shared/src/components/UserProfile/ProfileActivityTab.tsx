import {
  Activity,
  Building2,
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
} from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

interface Club {
  image_url: string;
  name: string;
  type: string;
}

interface Visit {
  id: string;
  visit_date: string;
  club_id: string;
  clubs: Club;
  user_id: string;
  credits_used: number;
  cost_to_club: number;
  payout_processed: boolean;
  subscription_type: string | null;
  unique_monthly_visit: boolean;
  created_at: string;
}

interface ProfileActivityTabProps {
  userVisits: Visit[];
  isLoadingVisits: boolean;
  totalWorkouts: number;
}

export const ProfileActivityTab: React.FC<ProfileActivityTabProps> = ({
  userVisits,
  isLoadingVisits,
  totalWorkouts,
}) => {
  // Get recent visits (last 10)
  const recentVisits = userVisits.slice(0, 10);

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyVisits = userVisits.filter((visit: Visit) => {
    const visitDate = new Date(visit.visit_date);
    return (
      visitDate.getMonth() === currentMonth &&
      visitDate.getFullYear() === currentYear
    );
  }).length;

  // Calculate weekly stats
  const weeklyVisits = userVisits.filter((visit: Visit) => {
    const visitDate = new Date(visit.visit_date);
    const now = new Date();
    const diffTime = now.getTime() - visitDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Idag";
    if (diffDays === 1) return "Igår";
    if (diffDays < 7) return `${diffDays} dagar sedan`;

    return date.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
    });
  };
  const renderColorStats = (
    value: string,
    title: string,
    icon: React.ReactNode,
    backgroundColor: string,
    iconBackgroundColor: string
  ) => {
    return (
      <View
        className={`flex-1 flex-row items-center justify-between ${backgroundColor} rounded-3xl p-3`}
      >
        <View className="flex-col">
          <View className="flex-row flex items-center justify-between w-full">
            <Text className="text-textSecondary text-xs mb-1">{title}</Text>
            <View
              className={`${iconBackgroundColor} w-6 h-6 rounded-full items-center justify-center`}
            >
              {icon}
            </View>
          </View>
          <Text className="text-textPrimary font-bold text-2xl">{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Stats Cards */}
      <View className="flex-row mb-6" style={{ gap: 12 }}>
        {renderColorStats(
          monthlyVisits.toString(),
          "Denna månad",
          <Calendar size={18} color="#4CAF50" strokeWidth={2.5} />,
          "bg-accentGreen/10",
          "bg-accentGreen/20"
        )}

        {renderColorStats(
          weeklyVisits.toString(),
          "Denna vecka",
          <TrendingUp size={18} color="#6366F1" strokeWidth={2.5} />,
          "bg-primary/10",
          "bg-primary/20"
        )}

        {renderColorStats(
          totalWorkouts.toString(),
          "Totalt",
          <Dumbbell size={18} color="#f97316" strokeWidth={2.5} />,
          "bg-orange-500/10",
          "bg-orange-500/20"
        )}
      </View>

      {/* Recent Activity */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-textPrimary font-bold text-lg">
            Senaste aktivitet
          </Text>
          <Activity size={20} color="#6366F1" />
        </View>

        {isLoadingVisits ? (
          <View className="bg-surface/50 rounded-3xl items-center py-8">
            <ActivityIndicator size="small" color="#6366F1" />
          </View>
        ) : recentVisits.length > 0 ? (
          <View style={{ gap: 12 }}>
            {recentVisits.map((visit: Visit) => {
              const imageUrl = visit.clubs?.image_url;

              return (
                <View key={visit.id} className="bg-surface/50 rounded-2xl p-4">
                  <View className="flex-row items-center mb-3">
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        className="w-12 h-12 rounded-xl mr-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-3">
                        <Building2 size={24} color="#6366F1" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-textPrimary font-bold text-base mb-1">
                        {visit.clubs?.name || "Okänt gym"}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {visit.clubs?.type || "Gym"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center bg-background/50 rounded-xl px-3 py-2">
                    <Clock size={14} color="#9CA3AF" />
                    <Text className="text-textSecondary text-sm ml-2">
                      {formatDate(visit.visit_date)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-surface/50 rounded-3xl p-8 items-center">
            <Activity size={48} color="#9CA3AF" />
            <Text className="text-textSecondary text-center mt-3">
              Ingen aktivitet än
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
