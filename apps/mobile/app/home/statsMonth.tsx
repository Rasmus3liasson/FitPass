import colors from '@shared/constants/custom-colors';
import { useUserBookings } from "@shared/hooks/useBookings";
import { useUserVisits } from "@shared/hooks/useVisits";
import { UserProfile } from "@shared/types";

import { Calendar, Barbell } from "phosphor-react-native";
import { Text, View } from "react-native";

export default function StatsMonth({ user }: { user: UserProfile }) {
  const { data: bookings = [] } = useUserBookings(user?.id || "");
  const { data: visits = [] } = useUserVisits(user?.id || "");

  // Calculate comprehensive workout stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Completed workouts this month (both classes and gym visits)
  const completedClassesThisMonth = bookings.filter((booking) => {
    const bookingDate = new Date(booking.created_at);
    return (
      booking.status === "completed" &&
      bookingDate.getMonth() === currentMonth &&
      bookingDate.getFullYear() === currentYear
    );
  }).length;

  const gymVisitsThisMonth = visits.filter((visit) => {
    const visitDate = new Date(visit.visit_date);
    return (
      visitDate.getMonth() === currentMonth &&
      visitDate.getFullYear() === currentYear
    );
  }).length;

  const totalWorkoutsThisMonth = completedClassesThisMonth + gymVisitsThisMonth;

  // Upcoming bookings
  const upcomingCount = bookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      new Date(booking.classes?.start_time || booking.created_at) > now
  ).length;

  return (
    <View className="px-4 mb-6">
      <Text className="text-textPrimary font-bold text-lg mb-4">This Month</Text>
      <View className="flex-row space-x-2">
        <View className="flex-1 bg-surface rounded-2xl p-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center">
              <Barbell size={16} color={colors.accentGreen} />
            </View>
            <Text className="text-xl font-bold text-textPrimary">
              {totalWorkoutsThisMonth}
            </Text>
          </View>
          <Text className="text-textSecondary text-xs">Workouts</Text>
          <Text className="text-green-400 text-xs mt-1">
            {completedClassesThisMonth} classes • {gymVisitsThisMonth} visits
          </Text>
        </View>

        <View className="flex-1 bg-surface rounded-2xl p-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-8 h-8 bg-blue-500/20 rounded-full items-center justify-center">
              <Calendar size={16} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-textPrimary">
              {upcomingCount}
            </Text>
          </View>
          <Text className="text-textSecondary text-xs">Upcoming</Text>
          <Text className="text-blue-400 text-xs mt-1">This week</Text>
        </View>
      </View>
    </View>
  );
}
