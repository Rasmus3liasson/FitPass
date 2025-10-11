import { CheckInModal } from "@/components/CheckInModal";
import { RecentClassesModal } from "@/components/RecentClassesModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { useAuth } from "@/hooks/useAuth";
import { useCancelBooking, useUserBookings } from "@/hooks/useBookings";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { FadeInView, SmoothPressable } from "@/src/components/SmoothPressable";
import { ROUTES } from "@/src/config/constants";
import colors from "@/src/constants/custom-colors";
import { useFriendsInClass } from "@/src/hooks/useFriends";
import { formatSwedishTime } from "@/src/utils/time";
import { Booking } from "@/types";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar, QrCode, User, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
    if (isToday(date)) return "Idag";
    if (isTomorrow(date)) return "Imorgon";
    if (isYesterday(date)) return "Igår";
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

  // Component to render friends attending the same class
  const FriendsInClass = ({ classId }: { classId: string }) => {
    const { data: friendsInClass = [] } = useFriendsInClass(user?.id || "", classId);
    
    if (!friendsInClass.length) return null;

    return (
      <View className="mb-6">
        <View className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
              <Users size={18} color={colors.primary} />
            </View>
            <View>
              <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide">
                Vänner som går
              </Text>
              <Text className="text-primary font-semibold text-sm">
                {friendsInClass.length} {friendsInClass.length === 1 ? 'vän' : 'vänner'} kommer
              </Text>
            </View>
          </View>
          <View className="flex-row items-center flex-wrap">
            {friendsInClass.slice(0, 4).map((friend, index) => (
              <View key={friend.id} className="mr-3 mb-2">
                {friend.avatar_url ? (
                  <Image
                    source={{ uri: friend.avatar_url }}
                    className="w-10 h-10 rounded-full border-3 border-primary shadow-lg"
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    }}
                  />
                ) : (
                  <View 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 items-center justify-center border-3 border-white shadow-lg"
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    }}
                  >
                    <Text className="text-white text-xs font-black">
                      {`${friend.first_name?.[0] || ''}${friend.last_name?.[0] || ''}`}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {friendsInClass.length > 4 && (
              <View 
                className="w-10 h-10 rounded-full bg-accentGray/20 items-center justify-center border-2 border-accentGray/30"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
              >
                <Text className="text-textSecondary text-xs font-bold">
                  +{friendsInClass.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderBookingCard = (
    booking: Booking,
    isUpcoming: boolean,
    index: number,
    isHorizontal: boolean = false
  ) => (
    <FadeInView key={booking.id} delay={index * 100}>
      <SmoothPressable
        className={`${isHorizontal ? "mr-4 w-80" : "mb-6"} rounded-3xl overflow-hidden`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedBooking(booking);
          setModalVisible(true);
        }}
        style={{
          shadowColor: isUpcoming ? "#6366F1" : "#10B981",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {/* Gradient Background Card */}
        <View
          className={`${
            isUpcoming
              ? "bg-gradient-to-br from-primary/10 via-surface to-surface"
              : "bg-gradient-to-br from-accentGreen/10 via-surface to-surface"
          } p-6 border-l-4 ${
            isUpcoming ? "border-l-primary" : "border-l-accentGreen"
          }`}
        >
          {/* Status Badge - Floating */}
          <View className="absolute top-4 right-4">
            <View
              className={`px-4 py-2 rounded-full ${
                isUpcoming
                  ? "bg-primary shadow-lg shadow-primary/30"
                  : "bg-accentGreen shadow-lg shadow-accentGreen/30"
              }`}
            >
              <Text className="text-textPrimary text-xs font-bold tracking-wide">
                {isUpcoming ? "KOMMANDE" : "GENOMFÖRD"}
              </Text>
            </View>
          </View>

          {/* Header with Better Typography */}
          <View className="mb-6 pr-24">
            <Text className="text-textPrimary font-black text-xl mb-2 tracking-tight">
              {booking.classes?.name || "Direktbesök"}
            </Text>
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  isUpcoming ? "bg-primary" : "bg-accentGreen"
                }`}
              />
              <Text className="text-textSecondary text-sm font-medium">
                {booking.classes?.clubs?.name ||
                  booking.clubs?.name ||
                  "Okänd anläggning"}
              </Text>
            </View>
          </View>

          {/* Modern Info Cards Grid */}
          <View className="flex-row mb-6 space-x-3">
            {/* Date Card */}
            <View className="flex-1 bg-background/50 rounded-2xl p-4 border border-primary/10">
              <View className="flex-row items-center mb-2">
                <Calendar size={16} color={colors.primary} />
                <Text className="text-textSecondary text-xs font-semibold ml-2 uppercase tracking-wide">
                  Datum
                </Text>
              </View>
              <Text className="text-textPrimary font-bold text-base">
                {formatDate(booking.classes?.start_time || booking.created_at)}
              </Text>
            </View>

            {/* Time Card */}
            <View className="flex-1 bg-background/50 rounded-2xl p-4 border border-primary/10">
              <View className="flex-row items-center mb-2">
                <View className="w-4 h-4 rounded-full bg-primary/20 items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-primary" />
                </View>
                <Text className="text-textSecondary text-xs font-semibold ml-2 uppercase tracking-wide">
                  Tid
                </Text>
              </View>
              <Text className="text-textPrimary font-bold text-base">
                {booking.classes
                  ? formatTime(
                      booking.classes.start_time,
                      booking.classes.end_time
                    )
                  : "Flexibel"}
              </Text>
            </View>

            {/* Duration Card */}
            {booking.classes && (
              <View className="flex-1 bg-background/50 rounded-2xl p-4 border border-primary/10">
                <View className="flex-row items-center mb-2">
                  <View className="w-4 h-4 rounded border border-primary/30">
                    <Text className="text-primary text-xs font-bold text-center leading-4">⏱</Text>
                  </View>
                  <Text className="text-textSecondary text-xs font-semibold ml-2 uppercase tracking-wide">
                    Längd
                  </Text>
                </View>
                <Text className="text-textPrimary font-bold text-base">
                  {booking.classes.start_time && booking.classes.end_time
                    ? `${Math.round(
                        (new Date(booking.classes.end_time).getTime() -
                          new Date(booking.classes.start_time).getTime()) /
                          (1000 * 60)
                      )}min`
                    : "60min"}
                </Text>
              </View>
            )}
          </View>

          {/* Instructor Section */}
          {booking.classes?.instructor && (
            <View className="mb-6">
              <View className="bg-background/30 rounded-2xl p-4 border border-accentGray/10">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gradient-to-br from-accentGray/20 to-accentGray/10 rounded-full items-center justify-center mr-4">
                    <User size={20} color={colors.textSecondary} />
                  </View>
                  <View>
                    <Text className="text-textSecondary text-xs font-semibold uppercase tracking-wide mb-1">
                      Instruktör
                    </Text>
                    <Text className="text-textPrimary font-semibold text-base">
                      {booking.classes.instructor.profiles?.display_name || "Ej tillgänglig"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Friends in Class */}
          {booking.class_id && <FriendsInClass classId={booking.class_id} />}

          {/* Modern Cancel Button for Upcoming */}
          {isUpcoming && (
            <TouchableOpacity
              className="bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-2xl py-4 px-6 border border-red-500/20 shadow-lg"
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
              style={{
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row items-center justify-center">
                {cancellingId === booking.id && cancelBooking.isPending && (
                  <ActivityIndicator
                    size="small"
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className="font-bold text-base text-red-500 tracking-wide">
                  {cancellingId === booking.id && cancelBooking.isPending
                    ? "Avbryter..."
                    : "Avboka"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
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
              Incheckning
            </Text>
            <Text className="text-textSecondary text-base">
              Hantera dina bokningar och träningsschema
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
                    Laddar bokningar...
                  </Text>
                  <Text className="text-textSecondary text-center">
                    Vänta medan vi hämtar ditt schema
                  </Text>
                </View>
              </View>
            ) : (
              <View className="px-6">
                {/* Modern Stats Cards */}
                <View className="flex-row mb-8 gap-4">
                  <View 
                    className="flex-1 bg-gradient-to-br from-primary/10 via-surface to-surface rounded-3xl p-6 border-l-4 border-l-primary"
                    style={{
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.1,
                      shadowRadius: 16,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-3xl font-black text-textPrimary">
                        {upcomingBookings.length}
                      </Text>
                      <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center">
                        <Calendar size={20} color={colors.primary} />
                      </View>
                    </View>
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide">
                      Kommande pass
                    </Text>
                  </View>
                  
                  <View 
                    className="flex-1 bg-gradient-to-br from-accentGreen/10 via-surface to-surface rounded-3xl p-6 border-l-4 border-l-accentGreen"
                    style={{
                      shadowColor: "#10B981",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.1,
                      shadowRadius: 16,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-3xl font-black text-textPrimary">
                        {pastBookings.length}
                      </Text>
                      <View className="w-10 h-10 bg-accentGreen/20 rounded-full items-center justify-center">
                        <QrCode size={20} color="#10B981" />
                      </View>
                    </View>
                    <Text className="text-textSecondary text-sm font-semibold uppercase tracking-wide">
                      Genomförda pass
                    </Text>
                  </View>
                </View>

                {/* Upcoming Bookings */}
                <View className="mb-8">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-textPrimary font-bold text-xl">
                      Kommande
                    </Text>
                    {upcomingBookings.length > 0 && (
                      <Text className="text-textSecondary text-sm">
                        {upcomingBookings.length} bokning
                        {upcomingBookings.length !== 1 ? "ar" : ""}
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
                        Inga kommande bokningar
                      </Text>
                      <Text className="text-textSecondary text-center mb-4">
                        Redo att upptäcka fantastiska träningspass?
                      </Text>
                      <TouchableOpacity
                        className="bg-primary rounded-xl px-6 py-3"
                        onPress={() => router.push(ROUTES.DISCOVER as any)}
                      >
                        <Text className="text-textPrimary font-semibold">
                          Bläddra bland pass
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Recent Bookings - Horizontal Scroll */}
                {pastBookings.length > 0 && (
                  <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-textPrimary font-bold text-xl">
                        Senaste
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowRecentClassesModal(true)}
                        className="bg-accentGray/50 px-3 py-1.5 rounded-full"
                      >
                        <Text className="text-textSecondary text-sm font-medium">
                          Visa alla
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
                      className="-mx-6"
                    >
                      {pastBookings
                        .slice(0, 5)
                        .map((booking, index) =>
                          renderBookingCard(booking, false, index, true)
                        )}
                    </ScrollView>
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
            title="Senaste pass"
          />
        </View>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
