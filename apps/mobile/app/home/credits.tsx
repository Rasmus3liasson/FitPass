import { RecentClassesModal } from "@shared/components/RecentClassesModal";
import { ROUTES } from "@shared/config/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { useUserBookings } from "@shared/hooks/useBookings";
import { useMembership } from "@shared/hooks/useMembership";
import { addMonths, differenceInDays, format } from "date-fns";
import { useRouter } from "expo-router";
import {
    BarChart3,
    CalendarPlus,
    CreditCard,
    Plus,
    Timer,
    TrendingUp
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export const Credits = () => {
  const { membership, loading } = useMembership();
  const router = useRouter();
  const auth = useAuth();
  const { data: bookings = [] } = useUserBookings(auth.user?.id || "");
  const [showRecentClassesModal, setShowRecentClassesModal] = useState(false);

  // Transform bookings to RecentClass format for the modal
  const transformBookingsToRecentClasses = () => {
    return bookings
      .map((booking) => {
        let status: "completed" | "upcoming" | "cancelled" = "completed";

        if (booking.status === "confirmed") {
          const bookingTime = new Date(
            booking.classes?.start_time || booking.created_at
          );
          status = bookingTime > new Date() ? "upcoming" : "completed";
        } else if (booking.status === "completed") {
          status = "completed";
        } else {
          status = "cancelled";
        }

        return {
          id: booking.id,
          name: booking.classes?.title || "Direktbesök",
          facility: booking.clubs?.name || "Okänd Anläggning",
          image: booking.clubs?.image_url || "",
          date: format(
            new Date(booking.classes?.start_time || booking.created_at),
            "MMM dd"
          ),
          time: format(
            new Date(booking.classes?.start_time || booking.created_at),
            "HH:mm"
          ),
          duration: booking.classes?.duration
            ? `${booking.classes.duration} min`
            : "1 hour",
          instructor: booking.classes?.instructor || "Self-guided",
          status,
        };
      })
      .slice(0, 10); // Show last 10 bookings
  };

  const recentClasses = transformBookingsToRecentClasses();

  // Since data is preloaded in _layout.tsx, we only show loading on first mount
  // and skip it on subsequent renders when data is available from cache
  if (loading && !membership) {
    return (
      <View className="bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-5 mx-4 mb-4">
        <View className="flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#6366F1" />
          <Text className="text-textSecondary ml-3 text-sm">
            Laddar medlemsdata...
          </Text>
        </View>
      </View>
    );
  }

  if (!membership) {
    return (
      <View className="bg-white/5 backdrop-blur-sm rounded-2xl mx-4 mb-4">
        <TouchableOpacity
          className="px-4 py-6 items-center"
          onPress={() => router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)}
        >
          <View className="bg-white/10 rounded-full p-3 mb-3">
            <CreditCard size={24} color="#6366F1" />
          </View>
          <Text className="text-textPrimary text-base font-bold mb-1 text-center">
            Inget aktivt medlemskap
          </Text>
          <Text className="text-textSecondary text-sm text-center mb-3">
            Välj ett abonnemang för att komma igång
          </Text>
          <View className="bg-primary/20 px-4 py-2 rounded-full">
            <Text className="text-primary font-medium text-sm">Välj Plan</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const creditsLeft = membership.credits - membership.credits_used;
  const percentage = (membership.credits_used / membership.credits) * 100;
  const currentMonth = format(new Date(), "MMMM yyyy");

  // Calculate additional info
  const usageRate =
    membership.credits > 0
      ? (membership.credits_used / membership.credits) * 100
      : 0;
  const isHighUsage = usageRate > 80;
  const isLowCredits = creditsLeft <= 2;

  // Mock renewal date (you might want to get this from membership data)
  const renewalDate = addMonths(new Date(), 1);
  const daysUntilRenewal = differenceInDays(renewalDate, new Date());

  const getStatusColor = () => {
    if (isLowCredits) return "#EF4444";
    if (isHighUsage) return "#F59E0B";
    return "#10B981";
  };

  const getStatusText = () => {
    if (creditsLeft === 0) return "Inga krediter kvar";
    if (isLowCredits) return "Få krediter kvar";
    if (isHighUsage) return "Högt användande";
    return "Bra balans";
  };

  return (
    <View className="mx-4 mb-4">
      {/* Main Credits Card */}
      <View className="bg-surface backdrop-blur-sm rounded-2xl overflow-hidden">
        <View className="px-4 py-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View>
                <Text className="text-textSecondary text-xs">
                  {currentMonth}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)}
              className="bg-white/10 px-3 py-1 rounded-lg"
            >
              <Text className="text-textSecondary text-xs font-medium">
                Hantera
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Section */}
          <View className="flex-row items-center mb-4">
            {/* <View className="relative">
              <ProgressCircle
                percentage={percentage}
                radius={32}
                strokeWidth={4}
                color="#6366F1"
                textColor="#FFFFFF"
              />
            </View> */}

            <View className="flex-1 ml-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-textPrimary text-lg font-bold">
                  {creditsLeft} / {membership.credits}
                </Text>
               {/*  <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: `${getStatusColor()}20` }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: getStatusColor() }}
                  >
                    {getStatusText()}
                  </Text>
                </View> */}
              </View>

              <View className="flex-row justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs">Använt</Text>
                  <Text className="text-textPrimary text-sm font-semibold">
                    {membership.credits_used}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-textSecondary text-xs">
                    Återställs om
                  </Text>
                  <Text className="text-textPrimary text-sm font-semibold">
                    {daysUntilRenewal} dagar
                  </Text>
                </View>
              </View>

              {/* Usage Bar */}
              <View className="bg-gray-600/30 h-1.5 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getStatusColor(),
                  }}
                />
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between">
            <Pressable
              onPress={() => router.push(ROUTES.DISCOVER as any)}
              className="flex-1 bg-white/10 rounded-xl p-3 mr-1 items-center"
            >
              <CalendarPlus size={16} color="#6366F1" />
              <Text className="text-textPrimary text-xs font-medium mt-1">
                Boka
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)
              }
              className="flex-1 bg-white/10 rounded-xl p-3 mx-1 items-center"
            >
              <Plus size={16} color="#10B981" />
              <Text className="text-textPrimary text-xs font-medium mt-1">
                Uppgradera
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowRecentClassesModal(true)}
              className="flex-1 bg-white/10 rounded-xl p-3 ml-1 items-center"
            >
              <BarChart3 size={16} color="#F59E0B" />
              <Text className="text-textPrimary text-xs font-medium mt-1">
                Historik
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Statistics Cards */}
      {membership.credits_used > 0 && (
        <View className="flex-row mt-3 space-x-2 gap-2">
          <View className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-textSecondary text-xs">
                Denna månad
              </Text>
              <TrendingUp size={14} color="#10B981" />
            </View>
            <Text className="text-textPrimary text-base font-bold">
              {((membership.credits_used / membership.credits) * 100).toFixed(
                0
              )}
              %
            </Text>
            <Text className="text-textSecondary text-xs">Utnyttjad</Text>
          </View>

          <View className="flex-1 bg-white/5 backdrop-blur-sm rounded-xl p-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-textSecondary text-xs">
                Snitt/vecka
              </Text>
              <Timer size={14} color="#6366F1" />
            </View>
            <Text className="text-textPrimary text-base font-bold">
              {(membership.credits_used / 4).toFixed(1)}
            </Text>
            <Text className="text-textSecondary text-xs">Besök</Text>
          </View>
        </View>
      )}

      {/* Recent Classes Modal */}
      <RecentClassesModal
        visible={showRecentClassesModal}
        onClose={() => setShowRecentClassesModal(false)}
        classes={recentClasses}
        title="Senaste besök"
      />
    </View>
  );
};
