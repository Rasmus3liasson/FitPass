import { CheckInModal } from "@/components/CheckInModal";
import { RecentClassesModal } from "@/components/RecentClassesModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useCancelBooking, useUserBookings } from "@/hooks/useBookings";
import colors from "@/src/constants/custom-colors";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { Calendar, QrCode, User } from "lucide-react-native";
import React, { useState } from "react";
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
      let status: 'completed' | 'upcoming' | 'cancelled' = 'completed';
      
      if (booking.status === "confirmed") {
        const bookingTime = new Date(booking.classes?.start_time || booking.created_at);
        status = bookingTime > new Date() ? 'upcoming' : 'completed';
      } else if (booking.status === "completed") {
        status = 'completed';
      } else {
        status = 'cancelled';
      }

      return {
        id: booking.id,
        name: booking.classes?.name || "Direct Visit",
        facility: booking.classes?.clubs?.name || booking.clubs?.name || "Unknown Facility",
        image: booking.classes?.clubs?.image_url || booking.clubs?.image_url || "https://via.placeholder.com/150",
        date: formatDate(booking.classes?.start_time || booking.created_at),
        time: booking.classes 
          ? formatTime(booking.classes.start_time, booking.classes.end_time)
          : "Anytime",
        duration: booking.classes ? `${booking.classes.duration || 60} min` : "Flexible",
        instructor: booking.classes?.instructor?.profiles?.display_name || "N/A",
        status
      };
    });
  };

  const recentClasses = transformBookingsToRecentClasses();

  const renderBookingCard = (booking: Booking, isUpcoming: boolean) => (
    <TouchableOpacity
      key={booking.id}
      className="bg-surface/30 backdrop-blur-sm rounded-3xl p-6 mb-4 border border-surface/20 shadow-xl active:bg-surface/40"
      onPress={() => {
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
            {booking.classes?.clubs?.name || booking.clubs?.name || "Unknown Facility"}
          </Text>
        </View>
        
        {/* Status Badge */}
        <View 
          className={`px-4 py-2 rounded-full ${
            isUpcoming 
              ? 'bg-primary/20 border border-primary/30' 
              : 'bg-green-500/20 border border-green-500/30'
          }`}
        >
          <Text 
            className={`text-sm font-bold ${
              isUpcoming ? 'text-primary' : 'text-green-400'
            }`}
          >
            {isUpcoming ? 'Upcoming' : 'Completed'}
          </Text>
        </View>
      </View>

      {/* Time and Date Info */}
      <View className="bg-background/30 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-primary/20 p-2 rounded-xl mr-3">
              <Calendar size={20} color={colors.primary} />
            </View>
            <View>
              <Text className="text-white font-semibold text-base">
                {new Date(booking.classes?.start_time || booking.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
              <Text className="text-textSecondary text-sm opacity-80">
                {booking.classes 
                  ? new Date(booking.classes.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                  : "Flexible timing"
                }
              </Text>
            </View>
          </View>
          
          {/* Duration */}
          <View className="items-end">
            <Text className="text-white font-medium text-sm">
              {booking.classes ? (
                booking.classes.start_time && booking.classes.end_time
                  ? `${Math.round((new Date(booking.classes.end_time).getTime() - new Date(booking.classes.start_time).getTime()) / (1000 * 60))} min`
                  : "60 min"
              ) : "Flexible"}
            </Text>
            <Text className="text-textSecondary text-xs opacity-60">
              Duration
            </Text>
          </View>
        </View>
      </View>

      {/* Instructor Info */}
      {booking.classes?.instructor && (
        <View className="flex-row items-center mb-4">
          <View className="bg-surface/40 p-2 rounded-xl mr-3">
            <User size={18} color={colors.textSecondary} />
          </View>
          <View>
            <Text className="text-textSecondary text-sm opacity-80">
              Instructor
            </Text>
            <Text className="text-white font-medium text-base">
              {booking.classes.instructor.profiles?.display_name || "N/A"}
            </Text>
          </View>
        </View>
      )}

      {/* Action Button for Upcoming Bookings */}
      {isUpcoming && (
        <TouchableOpacity 
          className="bg-red-500/20 border border-red-500/30 rounded-2xl py-3 px-4 mt-2 active:bg-red-500/30"
          onPress={(e) => {
            e.stopPropagation();
            setCancellingId(booking.id);
            cancelBooking.mutate(booking.id);
          }}
        >
          <Text className="text-red-400 font-bold text-center text-base">
            {cancellingId === booking.id && cancelBooking.isPending
              ? "Cancelling..."
              : "Cancel Booking"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper edges={['top']}>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <View className="px-6 pt-6 pb-4">
          <Text className="text-white font-bold text-3xl mb-2">Check In</Text>
          <Text className="text-textSecondary text-lg opacity-80">
            Your bookings and classes
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-16">
              <View className="bg-surface/50 backdrop-blur-sm rounded-3xl p-8 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-textSecondary mt-4 font-medium">
                  Loading your bookings...
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
                      Upcoming Classes
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
                    {upcomingBookings.map((booking) =>
                      renderBookingCard(booking, true)
                    )}
                  </View>
                ) : (
                  <View className="bg-surface/30 backdrop-blur-sm rounded-3xl p-8 items-center border border-surface/20 shadow-lg">
                    <View className="bg-surface/40 p-4 rounded-2xl mb-4">
                      <QrCode size={48} color={colors.textSecondary} />
                    </View>
                    <Text className="text-white font-semibold text-lg mb-2">
                      No upcoming bookings
                    </Text>
                    <Text className="text-textSecondary text-center text-base opacity-80 leading-relaxed">
                      Book a class to see it here and get ready for check-in
                    </Text>
                  </View>
                )}
              </View>

              {/* Past Bookings */}
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-white font-bold text-2xl">
                      Recent Classes
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
                  {pastBookings.map((booking) =>
                    renderBookingCard(booking, false)
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
    </SafeAreaWrapper>
  );
}
