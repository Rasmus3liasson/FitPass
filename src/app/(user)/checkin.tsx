import { CheckInModal } from "@/components/CheckInModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useCancelBooking } from "@/hooks/useBookings";
import { getUserBookings } from "@/lib/integrations/supabase/queries/bookingQueries";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { Calendar, Clock, MapPin, QrCode } from "lucide-react-native";
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelBooking = useCancelBooking();

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserBookings(user.id);
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderBookingCard = (booking: Booking, isUpcoming: boolean = true) => (
    <TouchableOpacity
      key={booking.id}
      className="bg-surface rounded-2xl p-4 mb-4 shadow-lg"
      onPress={() => handleBookingPress(booking)}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-lg mb-1">
            {booking.classes?.name || "Direct Visit"}
          </Text>
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {booking.classes?.clubs?.name || booking.clubs?.name}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-2">
          {isUpcoming && (
            <View className="bg-primary rounded-full p-2">
              <QrCode size={20} color="#FFFFFF" />
            </View>
          )}
          <View
            className={`px-3 py-1 rounded-full ${
              booking.status === "confirmed"
                ? "bg-green-500/20"
                : "bg-gray-500/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                booking.status === "confirmed"
                  ? "text-green-400"
                  : "text-gray-400"
              }`}
            >
              {booking.status}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Calendar size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {formatDate(booking.classes?.start_time || booking.created_at)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Clock size={14} color="#A0A0A0" />
            <Text className="text-textSecondary text-sm ml-1">
              {booking.classes
                ? formatTime(
                    booking.classes.start_time,
                    booking.classes.end_time
                  )
                : "Anytime"}
            </Text>
          </View>
        </View>
        <View className="bg-primary/10 px-3 py-1 rounded-full">
          <Text className="text-primary text-xs font-semibold">
            {booking.credits_used} credit{booking.credits_used !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {booking.classes?.instructor?.profiles?.display_name && (
        <View className="mt-3 pt-3 border-t border-borderGray">
          <Text className="text-textSecondary text-sm">
            Instructor: {booking.classes.instructor.profiles.display_name}
          </Text>
        </View>
      )}

      {isUpcoming && (
        <TouchableOpacity
          style={{
            marginTop: 8,
            backgroundColor: "#F44336",
            padding: 8,
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={() => {
            setCancellingId(booking.id);
            cancelBooking.mutate(booking.id, {
              onSuccess: () => {
                setCancellingId(null);
                fetchBookings();
              },
              onError: () => setCancellingId(null),
            });
          }}
          disabled={cancellingId === booking.id && cancelBooking.isPending}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            {cancellingId === booking.id && cancelBooking.isPending
              ? "Cancelling..."
              : "Cancel Booking"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <View className="px-4 pt-4">
          <Text className="text-white font-bold text-2xl mb-1">Check In</Text>
          <Text className="text-textSecondary text-base">
            Your bookings and classes
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : (
            <>
              {/* Upcoming Bookings */}
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white font-bold text-xl">
                    Upcoming Classes
                  </Text>
                  <Text className="text-primary text-sm font-semibold">
                    {upcomingBookings.length} booked
                  </Text>
                </View>

                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking) =>
                    renderBookingCard(booking, true)
                  )
                ) : (
                  <View className="bg-surface rounded-2xl p-6 items-center">
                    <QrCode size={48} color="#A0A0A0" />
                    <Text className="text-textSecondary text-center mt-4">
                      No upcoming bookings
                    </Text>
                    <Text className="text-textSecondary text-center text-sm mt-1">
                      Book a class to see it here
                    </Text>
                  </View>
                )}
              </View>

              {/* Past Bookings */}
              <View className="mb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white font-bold text-xl">
                    Recent Classes
                  </Text>
                  <TouchableOpacity>
                    <Text className="text-primary text-sm font-semibold">
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                {pastBookings.map((booking) =>
                  renderBookingCard(booking, false)
                )}
              </View>

              {/* Quick Actions */}
              <View className="mb-8">
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
              </View>
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
      </View>
    </SafeAreaWrapper>
  );
}
