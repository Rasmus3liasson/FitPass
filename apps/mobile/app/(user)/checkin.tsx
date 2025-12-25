import { colors } from "@shared";
import { AnimatedScreen } from "@shared/components/AnimationProvider";
import { CheckInModal } from "@shared/components/CheckInModal";
import { PageHeader } from "@shared/components/PageHeader";
import { RecentClassesModal } from "@shared/components/RecentClassesModal";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { FadeInView, SmoothPressable } from "@shared/components/SmoothPressable";
import { ROUTES } from "@shared/config/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { useCancelBooking, useUserBookings } from "@shared/hooks/useBookings";
import { useFriendsInClass } from "@shared/hooks/useFriends";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { Booking } from "@shared/types";
import { formatSwedishTime } from "@shared/utils/time";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar, QrCode, User, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
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
  const { showSuccess, showError } = useGlobalFeedback();

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
        name: booking.classes?.name || "Direktbesök",
        facility:
          booking.classes?.clubs?.name ||
          booking.clubs?.name ||
          "Okänd Anläggning",
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
    const { data: friendsInClass = [] } = useFriendsInClass(
      user?.id || "",
      classId
    );

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
                {friendsInClass.length}{" "}
                {friendsInClass.length === 1 ? "vän" : "vänner"} kommer
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
                      {`${friend.first_name?.[0] || ""}${
                        friend.last_name?.[0] || ""
                      }`}
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
    bookingItem: Booking,
    isUpcoming: boolean,
    index: number,
    isHorizontal: boolean = false,
    disable = false
  ) => (
    <FadeInView key={bookingItem.id} delay={index * 100}>
      <SmoothPressable
        disabled={disable}
        className={`${
          isHorizontal ? "mr-4 w-80" : "mb-4"
        } rounded-3xl overflow-hidden`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedBooking(bookingItem);
          setModalVisible(true);
        }}
        style={{
          shadowColor: isUpcoming ? "#6366F1" : "#10B981",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View className="bg-surface rounded-3xl p-5 border border-surface/20">
          {/* Clean Header */}
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-textPrimary font-bold text-lg mb-1 leading-tight">
                {bookingItem.classes?.name || "Direktbesök"}
              </Text>
              <Text className="text-textSecondary text-sm">
                {bookingItem.classes?.clubs?.name ||
                  bookingItem.clubs?.name ||
                  "Okänd anläggning"}
              </Text>
            </View>

            {/* Compact Status Indicator */}
            <View
              className={`px-3 py-1.5 rounded-full ${
                isUpcoming
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-green-500/10 border border-green-500/20"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isUpcoming ? "text-primary" : "text-green-500"
                }`}
              >
                {isUpcoming ? "Kommande" : "Klar"}
              </Text>
            </View>
          </View>

          {/* Compact Info Row */}
          <View className="flex-row items-center justify-between mb-4">
            {/* Date & Time */}
            <View className="flex-row items-center flex-1">
              <View
                className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
                  isUpcoming ? "bg-primary/10" : "bg-green-500/10"
                }`}
              >
                <Calendar
                  size={16}
                  color={isUpcoming ? colors.primary : "#10b981"}
                />
              </View>
              <View>
                <Text className="text-textPrimary font-semibold text-sm">
                  {formatDate(
                    bookingItem.classes?.start_time || bookingItem.created_at
                  )}
                </Text>
                <Text className="text-textSecondary text-xs">
                  {bookingItem.classes
                    ? formatTime(
                        bookingItem.classes.start_time,
                        bookingItem.classes.end_time
                      )
                    : "Flexibel tid"}
                </Text>
              </View>
            </View>

            {/* Duration Badge */}
            {bookingItem.classes && (
              <View className="bg-background rounded-lg px-3 py-2">
                <Text className="text-textSecondary text-xs font-medium">
                  {bookingItem.classes.start_time &&
                  bookingItem.classes.end_time
                    ? `${Math.round(
                        (new Date(bookingItem.classes.end_time).getTime() -
                          new Date(bookingItem.classes.start_time).getTime()) /
                          (1000 * 60)
                      )} min`
                    : "60 min"}
                </Text>
              </View>
            )}
          </View>

          {/* Instructor Info (Compact) */}
          {bookingItem.classes?.instructor && (
            <View className="flex-row items-center mb-4 p-3 bg-background/50 rounded-xl">
              <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
                <User size={14} color={colors.primary} />
              </View>
              <View>
                <Text className="text-textSecondary text-xs">Instruktör</Text>
                <Text className="text-textPrimary font-medium text-sm">
                  {bookingItem.classes.instructor.profiles?.display_name ||
                    "Ej tillgänglig"}
                </Text>
              </View>
            </View>
          )}

          {/* Friends Preview (Simplified) */}
          {bookingItem.class_id && (
            <FriendsPreview classId={bookingItem.class_id} />
          )}

          {/* Cancel Button (Minimalist) */}
          {isUpcoming && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-3 px-4 mt-2"
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCancellingId(bookingItem.id);
                cancelBooking.mutate(bookingItem.id, {
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
              disabled={
                cancellingId === bookingItem.id && cancelBooking.isPending
              }
            >
              <View className="flex-row items-center justify-center">
                {cancellingId === bookingItem.id && cancelBooking.isPending && (
                  <ActivityIndicator
                    size="small"
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className="font-medium text-sm text-textPrimary">
                  {cancellingId === bookingItem.id && cancelBooking.isPending
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

  // Simplified Friends Preview Component
  const FriendsPreview = ({ classId }: { classId: string }) => {
    const { data: friendsInClass = [] } = useFriendsInClass(
      user?.id || "",
      classId
    );

    if (!friendsInClass.length) return null;

    return (
      <View className="flex-row items-center mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <View className="flex-row items-center flex-1">
          <Users size={16} color={colors.primary} />
          <Text className="text-primary text-sm font-medium ml-2">
            {friendsInClass.length} vän
            {friendsInClass.length === 1 ? "" : "ner"} kommer
          </Text>
        </View>
        <View className="flex-row">
          {friendsInClass.slice(0, 3).map((friend, index) => (
            <View
              key={friend.id}
              className="w-6 h-6 rounded-full bg-primary items-center justify-center border-2 border-white -ml-1"
              style={{ zIndex: friendsInClass.length - index }}
            >
              <Text className="text-white text-xs font-bold">
                {friend.first_name?.[0] || "?"}
              </Text>
            </View>
          ))}
          {friendsInClass.length > 3 && (
            <View className="w-6 h-6 rounded-full bg-accentGray items-center justify-center border-2 border-white -ml-1">
              <Text className="text-white text-xs font-bold">
                +{friendsInClass.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper edges={["top"]}>
      <StatusBar style="light" />
      <AnimatedScreen>
        <View className="flex-1 bg-background">
          <PageHeader
            title="Incheckning"
            subtitle="Hantera dina bokningar och träningsschema"
          />

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {loading ? (
              <View className="flex-1 items-center justify-center py-20 px-6">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-textPrimary font-medium text-base mt-4 mb-2">
                  Laddar dina bokningar
                </Text>
                <Text className="text-textSecondary text-sm text-center">
                  Hämtar ditt träningsschema...
                </Text>
              </View>
            ) : (
              <View className="px-6">
                {/* Clean Stats Overview */}
                <View className="flex-row mb-6 gap-3">
                  <View className="flex-1 bg-surface rounded-2xl p-4 border border-surface/20">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-2xl font-bold text-textPrimary">
                          {upcomingBookings.length}
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          Kommande
                        </Text>
                      </View>
                      <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center">
                        <Calendar size={18} color={colors.primary} />
                      </View>
                    </View>
                  </View>

                  <View className="flex-1 bg-surface rounded-2xl p-4 border border-surface/20">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-2xl font-bold text-textPrimary">
                          {pastBookings.length}
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          Genomförda
                        </Text>
                      </View>
                      <View className="w-10 h-10 bg-green-500/10 rounded-xl items-center justify-center">
                        <QrCode size={18} color="#10b981" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 ? (
                  <View className="mb-6">
                    <Text className="text-textPrimary font-bold text-lg mb-3">
                      Kommande pass
                    </Text>
                    <View>
                      {upcomingBookings.map((booking, index) =>
                        renderBookingCard(booking, true, index)
                      )}
                    </View>
                  </View>
                ) : (
                  <View className="mb-6">
                    <View className="bg-surface rounded-2xl p-6 items-center border border-surface/20">
                      <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-4">
                        <Calendar size={24} color={colors.primary} />
                      </View>
                      <Text className="text-textPrimary font-semibold text-lg mb-2">
                        Inga kommande pass
                      </Text>
                      <Text className="text-textSecondary text-center mb-4 leading-relaxed">
                        Utforska träningspass i närheten och boka ditt nästa
                        träningspass
                      </Text>
                      <TouchableOpacity
                        className="bg-primary rounded-xl px-6 py-3"
                        onPress={() => router.push(ROUTES.DISCOVER as any)}
                      >
                        <Text className="text-white font-semibold">
                          Upptäck pass
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Recent Bookings */}
                {pastBookings.length > 0 && (
                  <View className="mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-textPrimary font-bold text-lg">
                        Senaste aktivitet
                      </Text>
                      {pastBookings.length > 3 && (
                        <TouchableOpacity
                          onPress={() => setShowRecentClassesModal(true)}
                          className="bg-surface border border-surface/20 px-3 py-1.5 rounded-lg"
                        >
                          <Text className="text-textSecondary text-sm font-medium">
                            Visa alla
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingRight: 24 }}
                    >
                      {pastBookings
                        .slice(0, 5)
                        .map((booking, index) =>
                          renderBookingCard(booking, false, index, true, true)
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
