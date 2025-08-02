import { CheckInModal } from "@/components/CheckInModal";
import { RecentClassesModal } from "@/components/RecentClassesModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useCancelBooking, useUserBookings } from "@/hooks/useBookings";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { FadeInView, SmoothPressable } from "@/src/components/SmoothPressable";
import { ROUTES } from "@/src/config/constants";
import colors from "@/src/constants/custom-colors";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar, QrCode, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CheckInScreen() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showRecentClassesModal, setShowRecentClassesModal] = useState(false);
  const { user } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelBooking = useCancelBooking();
  const { data: bookings = [], isLoading: loading } = useUserBookings(
    user?.id || ""
  );

  // Reset cancelling state if mutation is not pending
  useEffect(() => {
    if (!cancelBooking.isPending && cancellingId) {
      setCancellingId(null);
    }
  }, [cancelBooking.isPending, cancellingId]);

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${formatSwedishTime(start)} - ${formatSwedishTime(end)}`;
  };

  const upcomingBookings = bookings
    .filter((booking) => booking.status === "confirmed")
    .sort((a, b) => {
      const aTime = new Date(a.classes?.start_time || a.created_at).getTime();
      const bTime = new Date(b.classes?.start_time || b.created_at).getTime();
      return aTime - bTime;
    });

  const pastBookings = bookings
    .filter((booking) => booking.status === "completed")
    .sort((a, b) => {
      const aTime = new Date(a.classes?.start_time || a.created_at).getTime();
      const bTime = new Date(b.classes?.start_time || b.created_at).getTime();
      return bTime - aTime;
    });

  // Transform bookings to RecentClass format for the modal
  const transformBookingsToRecentClasses = () => {
    return bookings.map((booking) => {
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
        name: booking.classes?.name || "Direct Visit",
        facility:
          booking.classes?.clubs?.name ||
          booking.clubs?.name ||
          "Unknown Facility",
        image:
          booking.clubs?.image_url ||
          booking.classes?.clubs?.image_url ||
          "https://via.placeholder.com/150",
        date: formatDate(booking.classes?.start_time || booking.created_at),
        time: booking.classes
          ? formatTime(booking.classes.start_time, booking.classes.end_time)
          : "Anytime",
        duration: booking.classes
          ? `${booking.classes.duration || 60} min`
          : "Flexible",
        instructor:
          booking.classes?.instructor?.profiles?.display_name || "N/A",
        status,
      };
    });
  };

  const recentClasses = transformBookingsToRecentClasses();

  const renderBookingCard = (booking: Booking, isUpcoming: boolean, index: number) => (
    <FadeInView key={booking.id} delay={index * 100}>
      <SmoothPressable
        className="bg-surface/30 backdrop-blur-sm rounded-3xl p-6 mb-4 border border-surface/20 shadow-xl"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedBooking(booking);
          setModalVisible(true);
        }}
      >
      {/* Header with Club Info */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg leading-tight">
            {booking.classes?.name || "Direct Visit"}
          </Text>
          <Text className="text-textSecondary text-base mt-1 opacity-90">
            {booking.classes?.clubs?.name ||
              booking.clubs?.name ||
              "Unknown Facility"}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          className={`px-3 py-2 rounded-full flex-row items-center ${
            isUpcoming
              ? "bg-primary/20 border border-primary/30"
              : "bg-green-500/20 border border-green-500/30"
          }`}
        >
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              isUpcoming ? "bg-primary" : "bg-green-400"
            }`}
          />
          <Text
            className={`text-xs font-bold ${
              isUpcoming ? "text-primary" : "text-green-400"
            }`}
          >
            {isUpcoming ? "Upcoming" : "Completed"}
          </Text>
        </View>
      </View>

      {/* Time and Date Info */}
      <View className="bg-background/30 rounded-2xl p-4 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="bg-primary/20 p-3 rounded-xl mr-4">
              <Calendar size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">
                {formatDate(booking.classes?.start_time || booking.created_at)}
              </Text>
              <Text className="text-textSecondary text-sm opacity-80 mt-1">
                {booking.classes
                  ? formatTime(
                      booking.classes.start_time,
                      booking.classes.end_time
                    )
                  : "Flexible timing"}
              </Text>
            </View>
          </View>

          {/* Duration */}
          <View className="items-end">
            <Text className="text-white font-medium text-sm">
              {booking.classes
                ? booking.classes.start_time && booking.classes.end_time
                  ? `${Math.round(
                      (new Date(booking.classes.end_time).getTime() -
                        new Date(booking.classes.start_time).getTime()) /
                        (1000 * 60)
                    )} min`
                  : "60 min"
                : "Flexible"}
            </Text>
            <Text className="text-textSecondary text-xs opacity-60 mt-1">
              Duration
            </Text>
          </View>
        </View>
      </View>

      {/* Instructor Info */}
      {booking.classes?.instructor && (
        <View className="flex-row items-center bg-surface/20 rounded-2xl p-3 mb-3">
          <View className="bg-surface/40 p-2 rounded-xl mr-3">
            <User size={18} color={colors.textSecondary} />
          </View>
          <View className="flex-1">
            <Text className="text-textSecondary text-sm opacity-80">
              Instructor
            </Text>
            <Text className="text-white font-medium text-base mt-1">
              {booking.classes.instructor.profiles?.display_name || "N/A"}
            </Text>
          </View>
        </View>
      )}

      {/* Action Button for Upcoming Bookings */}
      {isUpcoming && (
        <TouchableOpacity
          className="bg-red-500/20 border border-red-500/30 rounded-2xl py-3 px-4 mt-4 active:bg-red-500/30"
          onPress={(e) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              setCancellingId(booking.id);
              cancelBooking.mutate(booking.id, {
                onSuccess: () => {
                  setCancellingId(null);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                },
                onError: (error) => {
                  console.error("Error cancelling booking:", error);
                  setCancellingId(null);
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Error
                  );
                },
              });
            } catch (error) {
              console.error(
                "Unexpected error during booking cancellation:",
                error
              );
              setCancellingId(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }}
          disabled={cancellingId === booking.id && cancelBooking.isPending}
        >
          <View className="flex-row items-center justify-center">
            {cancellingId === booking.id && cancelBooking.isPending && (
              <ActivityIndicator
                size="small"
                color="#ef4444"
                style={{ marginRight: 8 }}
              />
            )}
            <Text className="text-red-400 font-bold text-center text-base">
              {cancellingId === booking.id && cancelBooking.isPending
                ? "Cancelling..."
                : "Cancel Booking"}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      </SmoothPressable>
    </FadeInView>
  );

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <AnimatedScreen>
        <View className="flex-1 bg-background">
          <View className="px-6 pt-6 pb-6">
            <Text className="text-white font-bold text-3xl mb-2">Check In</Text>
            <Text className="text-textSecondary text-base opacity-90">
              Manage your bookings and track your fitness journey
            </Text>
          </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-8 items-center border border-surface/20 shadow-lg">
                <View className="bg-primary/20 p-6 rounded-full mb-4">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
                <Text className="text-white font-bold text-lg mb-2">
                  Loading your bookings
                </Text>
                <Text className="text-textSecondary text-center opacity-80">
                  Please wait while we fetch your latest bookings...
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Upcoming Bookings */}
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-white font-bold text-2xl">
                      Upcoming bookings
                    </Text>
                    <Text className="text-textSecondary text-sm mt-1 opacity-80">
                      Ready for check-in
                    </Text>
                  </View>
                  <View className="bg-primary/20 px-4 py-2 rounded-full">
                    <Text className="text-primary text-sm font-bold">
                      {upcomingBookings.length} booked
                    </Text>
                  </View>
                </View>

                {upcomingBookings.length > 0 ? (
                  <View className="space-y-4">
                    {upcomingBookings.map((booking, index) =>
                      renderBookingCard(booking, true, index)
                    )}
                  </View>
                ) : (
                  <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-8 items-center border border-surface/20 shadow-lg">
                    <View className="bg-primary/20 p-6 rounded-full mb-6">
                      <QrCode size={32} color={colors.primary} />
                    </View>
                    <Text className="text-white font-bold text-xl mb-3">
                      No upcoming bookings
                    </Text>
                    <Text className="text-textSecondary text-center text-base opacity-80 leading-relaxed mb-6">
                      Ready to discover amazing fitness classes? Book your next
                      workout and it will appear here.
                    </Text>
                    <TouchableOpacity
                      className="bg-primary/20 border border-primary/30 rounded-2xl px-6 py-3 active:bg-primary/30"
                      onPress={() => {
                        router.push(ROUTES.DISCOVER as any);
                      }}
                    >
                      <Text className="text-primary font-bold text-base">
                        Browse Classes
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Past Bookings */}
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-white font-bold text-2xl">
                      Recent
                    </Text>
                    <Text className="text-textSecondary text-sm mt-1 opacity-80">
                      Your completed sessions
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowRecentClassesModal(true)}
                    className="bg-primary/20 px-4 py-2 rounded-full border border-primary/30 active:bg-primary/30"
                  >
                    <Text className="text-primary text-sm font-bold">
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-4">
                  {pastBookings.length > 0 ? (
                    pastBookings
                      .slice(0, 3)
                      .map((booking, index) => renderBookingCard(booking, false, index))
                  ) : (
                    <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-6 items-center border border-surface/20">
                      <View className="bg-surface/40 p-4 rounded-2xl mb-4">
                        <Calendar size={24} color={colors.textSecondary} />
                      </View>
                      <Text className="text-white font-semibold text-base mb-2">
                        No recent activity
                      </Text>
                      <Text className="text-textSecondary text-center text-sm opacity-80">
                        Your completed sessions will appear here
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* <View className="mb-8">
                <Text className="text-white font-bold text-xl mb-4">
                  Quick Actions
                </Text>
                <View className="flex-row space-x-4">
                  <TouchableOpacity className="flex-1 bg-primary rounded-2xl p-4 items-center">
                    <QrCode size={24} color="#FFFFFF" />
                    <Text className="text-white font-semibold mt-2">
                      Direct Check-in
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-surface rounded-2xl p-4 items-center">
                    <Calendar size={24} color="#6366F1" />
                    <Text className="text-white font-semibold mt-2">
                      Book Class
                    </Text>
                  </TouchableOpacity>
                </View>
              </View> */}
            </>
          )}
        </ScrollView>

        {/* Check-in Modal */}
        <CheckInModal
          visible={modalVisible}
          booking={selectedBooking}
          onClose={() => {
            setModalVisible(false);
            setSelectedBooking(null);
          }}
        />

        {/* Recent Classes Modal */}
        <RecentClassesModal
          visible={showRecentClassesModal}
          onClose={() => setShowRecentClassesModal(false)}
          classes={recentClasses}
          title="Recent Classes"
        />
        </View>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
