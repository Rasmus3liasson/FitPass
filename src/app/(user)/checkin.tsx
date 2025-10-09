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

  const renderBookingCard = (
    booking: Booking,
    isUpcoming: boolean,
    index: number
  ) => (
    <FadeInView key={booking.id} delay={index * 100}>
      <SmoothPressable
        className="bg-surface rounded-2xl p-5 mb-4 border border-gray-800/50"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedBooking(booking);
          setModalVisible(true);
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-white font-bold text-lg mb-1">
              {booking.classes?.name || "Direct Visit"}
            </Text>
            <Text className="text-gray-400 text-sm">
              {booking.classes?.clubs?.name ||
                booking.clubs?.name ||
                "Unknown Facility"}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            className={`px-3 py-1.5 rounded-full ${
              isUpcoming ? "bg-accentBlue/20" : "bg-accentGreen/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isUpcoming ? "text-accentBlue" : "text-accentGreen"
              }`}
            >
              {isUpcoming ? "Upcoming" : "Completed"}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View className="flex-row items-center mb-4">
          <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
            <Calendar size={18} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">
              {formatDate(booking.classes?.start_time || booking.created_at)}
            </Text>
            <Text className="text-gray-400 text-sm">
              {booking.classes
                ? formatTime(
                    booking.classes.start_time,
                    booking.classes.end_time
                  )
                : "Flexible timing"}
            </Text>
          </View>
          {booking.classes && (
            <Text className="text-gray-400 text-sm">
              {booking.classes.start_time && booking.classes.end_time
                ? `${Math.round(
                    (new Date(booking.classes.end_time).getTime() -
                      new Date(booking.classes.start_time).getTime()) /
                      (1000 * 60)
                  )} min`
                : "60 min"}
            </Text>
          )}
        </View>

        {/* Instructor */}
        {booking.classes?.instructor && (
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gray-700/50 rounded-full items-center justify-center mr-3">
              <User size={18} color={colors.textSecondary} />
            </View>
            <Text className="text-textSecondary text-sm">
              {booking.classes.instructor.profiles?.display_name || "N/A"}
            </Text>
          </View>
        )}

        {/* Action Button for Upcoming */}
        {isUpcoming && (
          <TouchableOpacity
            className="bg-red-500/20 rounded-xl py-3 mt-2 border border-red-500/30"
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              <Text className="font-semibold text-sm text-accentRed">
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
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-textPrimary font-bold text-2xl mb-1">
              Check In
            </Text>
            <Text className="text-textSecondary text-base">
              Manage your bookings and fitness schedule
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center py-20 px-6">
                <View className="bg-surface rounded-2xl p-8 items-center w-full">
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    className="mb-4"
                  />
                  <Text className="text-textPrimary font-semibold text-lg mb-2">
                    Loading bookings...
                  </Text>
                  <Text className="text-textSecondary text-center">
                    Please wait while we fetch your schedule
                  </Text>
                </View>
              </View>
            ) : (
              <View className="px-6">
                {/* Stats Cards */}
                <View className="flex-row mb-6 space-x-4 gap-4">
                  <View className="flex-1 bg-surface rounded-xl p-4">
                    <Text className="text-2xl font-bold text-textPrimary mb-1">
                      {upcomingBookings.length}
                    </Text>
                    <Text className="text-textSecondary text-sm">Upcoming</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4">
                    <Text className="text-2xl font-bold text-white mb-1">
                      {pastBookings.length}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      Completed
                    </Text>
                  </View>
                </View>

                {/* Upcoming Bookings */}
                <View className="mb-8">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-textPrimary font-bold text-xl">
                      Upcoming
                    </Text>
                    {upcomingBookings.length > 0 && (
                      <Text className="text-textSecondary text-sm">
                        {upcomingBookings.length} booking
                        {upcomingBookings.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>

                  {upcomingBookings.length > 0 ? (
                    <View>
                      {upcomingBookings.map((booking, index) =>
                        renderBookingCard(booking, true, index)
                      )}
                    </View>
                  ) : (
                    <View className="bg-surface rounded-2xl p-6 items-center">
                      <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                        <QrCode size={24} color={colors.primary} />
                      </View>
                      <Text className="text-textPrimary font-semibold text-lg mb-2">
                        No upcoming bookings
                      </Text>
                      <Text className="text-textSecondary text-center mb-4">
                        Ready to discover amazing fitness classes?
                      </Text>
                      <TouchableOpacity
                        className="bg-primary rounded-xl px-6 py-3"
                        onPress={() => router.push(ROUTES.DISCOVER as any)}
                      >
                        <Text className="text-textPrimary font-semibold">
                          Browse Classes
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Recent Bookings */}
                {pastBookings.length > 0 && (
                  <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-textPrimary font-bold text-xl">
                        Recent
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowRecentClassesModal(true)}
                        className="bg-gray-700/50 px-3 py-1.5 rounded-full"
                      >
                        <Text className="text-textSecondary text-sm font-medium">
                          View All
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View>
                      {pastBookings
                        .slice(0, 3)
                        .map((booking, index) =>
                          renderBookingCard(booking, false, index)
                        )}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Modals */}
          <CheckInModal
            visible={modalVisible}
            booking={selectedBooking}
            onClose={() => {
              setModalVisible(false);
              setSelectedBooking(null);
            }}
          />

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
