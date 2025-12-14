import { Activity, Building2, Calendar, MapPin } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

interface ProfileActivityTabProps {
  userVisits: any[];
  isLoadingVisits: boolean;
}

export const ProfileActivityTab: React.FC<ProfileActivityTabProps> = ({
  userVisits,
  isLoadingVisits,
}) => {
  // Get recent visits (last 10)
  const recentVisits = userVisits.slice(0, 10);

  // Calculate monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyVisits = userVisits.filter((visit: any) => {
    const visitDate = new Date(visit.check_in_time);
    return (
      visitDate.getMonth() === currentMonth &&
      visitDate.getFullYear() === currentYear
    );
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

  return (
    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
      {/* Monthly Stats */}
      <View className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 mb-4 border border-green-500/20">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-textSecondary text-sm mb-1">
              Denna månad
            </Text>
            <Text className="text-textPrimary font-bold text-2xl">
              {monthlyVisits} träningar
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center">
            <Calendar size={24} color="#10b981" strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-textPrimary font-semibold text-base">
            Senaste aktivitet
          </Text>
          <Activity size={18} color="#8B5CF6" />
        </View>

        {isLoadingVisits ? (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#8B5CF6" />
          </View>
        ) : recentVisits.length > 0 ? (
          <View className="space-y-3">
            {recentVisits.map((visit: any, index: number) => (
              <View
                key={visit.id || index}
                className="flex-row items-start bg-background rounded-xl p-3 border border-border"
              >
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3 mt-1">
                  <Building2 size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-semibold mb-1">
                    {visit.gym?.name || "Okänt gym"}
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="text-textSecondary text-xs ml-1">
                      {visit.gym?.city || "Okänd plats"}
                    </Text>
                  </View>
                  <Text className="text-textSecondary text-xs">
                    {formatDate(visit.check_in_time)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-textSecondary text-center py-4">
            Ingen aktivitet än
          </Text>
        )}
      </View>
    </ScrollView>
  );
};
