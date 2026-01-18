import { colors } from "@shared";
import { AnimatedScreen } from "@shared/components/AnimationProvider";
import {
  BookingCard,
  CancelConfirmationModal,
  ClassesDiscoveryModal,
} from "@shared/components/checkin";
import { CheckInModal } from "@shared/components/CheckInModal";
import { ClassBookingModal } from "@shared/components/ClassBookingModal";
import { PageHeader } from "@shared/components/PageHeader";
import { RecentClassesModal } from "@shared/components/RecentClassesModal";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { useAuth } from "@shared/hooks/useAuth";
import { useCancelBooking, useUserBookings } from "@shared/hooks/useBookings";
import { useFriendsInClass } from "@shared/hooks/useFriends";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { useUserVisits } from "@shared/hooks/useVisits";
import { getAllClasses } from "@shared/lib/integrations/supabase/queries/classQueries";
import { Booking, BookingStatus } from "@shared/types";
import { formatSwedishTime } from "@shared/utils/time";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { Calendar, QrCode, Users } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Interface for class items from discovery/API
interface ClassItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  club_id: string;
  clubs?: { name: string };
  intensity?: "Low" | "Medium" | "High";
  max_participants?: number;
  current_participants?: number;
  description?: string;
  instructor?: {
    profiles?: { display_name: string };
  };
}

export default function CheckInScreen() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showRecentClassesModal, setShowRecentClassesModal] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const { user } = useAuth();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelBooking = useCancelBooking();
  const { data: bookings = [], isLoading: loading } = useUserBookings(
    user?.id || "",
  );
  const { data: visits = [], isLoading: visitsLoading } = useUserVisits(
    user?.id || "",
  );
  const { showSuccess, showError } = useGlobalFeedback();

  useEffect(() => {
    if (!cancelBooking.isPending && cancellingId) {
      setCancellingId(null);
    }
  }, [cancelBooking.isPending, cancellingId]);

  const handleDiscoverClasses = async () => {
    setShowClassesModal(true);
    if (allClasses.length === 0) {
      setLoadingClasses(true);
      try {
        const classes = await getAllClasses();
        const upcomingClasses = classes
          .filter((c) => new Date(c.end_time) > new Date())
          .map((c) => ({
            ...c,
            max_participants: c.max_participants || c.capacity,
            current_participants: c.current_participants ?? c.booked_spots ?? 0,
            intensity:
              c.intensity === "Low" ||
              c.intensity === "Medium" ||
              c.intensity === "High"
                ? c.intensity
                : undefined,
          }));
        setAllClasses(upcomingClasses as ClassItem[]);
      } catch (error) {
        console.error("Error fetching classes:", error);
        showError("Fel", "Kunde inte hämta klasser. Försök igen.");
      } finally {
        setLoadingClasses(false);
      }
    }
  };

  const handleClassSelection = useCallback(
    async (classItem: ClassItem) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const alreadyBooked = bookings.some(
        (booking) =>
          booking.class_id === classItem.id &&
          (booking.status === BookingStatus.CONFIRMED ||
            booking.status === BookingStatus.PENDING),
      );

      if (alreadyBooked) {
        showError(
          "Redan bokad",
          "Du har redan bokat detta pass. Kontrollera dina bokningar.",
        );
        return;
      }

      setShowClassesModal(false);

      setTimeout(() => {
        setSelectedClass(classItem);
        setShowBookingModal(true);
      }, 300);
    },
    [bookings, showError],
  );

  const handleCancelBooking = () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.id);
    cancelBooking.mutate(bookingToCancel.id, {
      onSuccess: () => {
        setCancellingId(null);
        setShowCancelConfirmModal(false);
        setBookingToCancel(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess("Bokning avbokad", "Ditt pass har avbokats.");
      },
      onError: (error) => {
        console.error("Error cancelling booking:", error);
        setCancellingId(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showError("Fel", "Kunde inte avboka passet. Försök igen.");
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Idag";
    if (isTomorrow(date)) return "Imorgon";
    if (isYesterday(date)) return "Igår";

    const day = format(date, "d");
    const month = format(date, "MMM"); // This will use default locale
    return `${day} ${month}`;
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${formatSwedishTime(start)} - ${formatSwedishTime(end)}`;
  };

  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.PENDING,
    )
    .sort((a, b) => {
      const aTime = new Date(a.classes?.start_time || a.created_at).getTime();
      const bTime = new Date(b.classes?.start_time || b.created_at).getTime();
      return aTime - bTime;
    });

  // Past bookings now come from visits table (source of truth)
  const pastBookings = visits
    .map(
      (visit) =>
        ({
          id: visit.id,
          user_id: visit.user_id,
          class_id: visit.class_id || "", // Provide empty string instead of null
          credits_used: visit.credits_used,
          status: BookingStatus.CONFIRMED,
          created_at: visit.visit_date,
          updated_at: visit.visit_date,
          clubs: visit.clubs,
          classes: null as any,
        }) as Booking,
    )
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });

  const transformBookingsToRecentClasses = () => {
    return bookings.map((booking) => {
      let status: "completed" | "upcoming" | "cancelled" = "completed";

      if (
        booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.PENDING
      ) {
        const bookingTime = new Date(
          booking.classes?.start_time || booking.created_at,
        );
        status = bookingTime > new Date() ? "upcoming" : "completed";
      } else if (booking.status === BookingStatus.CANCELLED) {
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
      classId,
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
              <Text className="text-textPrimary font-semibold text-sm">
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

  const FriendsPreview = ({ classId }: { classId: string }) => {
    const { data: friendsInClass = [] } = useFriendsInClass(
      user?.id || "",
      classId,
    );

    if (!friendsInClass.length) return null;

    return friendsInClass;
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
                        <QrCode size={18} color={colors.accentGreen} />
                      </View>
                    </View>
                  </View>
                </View>

                {upcomingBookings.length > 0 ? (
                  <View className="mb-6">
                    <Text className="text-textPrimary font-bold text-lg mb-3">
                      Kommande pass
                    </Text>
                    <View>
                      {upcomingBookings.map((booking, index) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          isUpcoming={true}
                          index={index}
                          userId={user?.id}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                            setSelectedBooking(booking);
                            setModalVisible(true);
                          }}
                          onCancel={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Medium,
                            );
                            setBookingToCancel(booking);
                            setShowCancelConfirmModal(true);
                          }}
                          isCancelling={
                            cancellingId === booking.id &&
                            cancelBooking.isPending
                          }
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View className="mb-6">
                    <View className="bg-surface rounded-2xl p-6 items-center border border-surface/20">
                      <Text className="text-textPrimary font-semibold text-lg mb-2">
                        Inga kommande pass
                      </Text>
                      <Text className="text-textSecondary text-center mb-4 leading-relaxed">
                        Utforska träningspass i närheten och boka ditt nästa
                        träningspass
                      </Text>
                      <TouchableOpacity
                        className="bg-primary rounded-xl px-6 py-3"
                        onPress={handleDiscoverClasses}
                      >
                        <Text className="text-white font-semibold">
                          Upptäck pass
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

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
                      {pastBookings.slice(0, 5).map((booking, index) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          isUpcoming={false}
                          index={index}
                          isHorizontal={true}
                          disabled={true}
                          userId={user?.id}
                          onPress={() => {}}
                          onCancel={() => {}}
                          isCancelling={false}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

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

          <ClassesDiscoveryModal
            visible={showClassesModal}
            onClose={() => setShowClassesModal(false)}
            classes={allClasses}
            loading={loadingClasses}
            onClassSelect={handleClassSelection}
          />
        </View>
      </AnimatedScreen>

      {selectedClass && showBookingModal && (
        <ClassBookingModal
          visible={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);

            setTimeout(() => setSelectedClass(null), 300);
          }}
          classId={selectedClass?.id || ""}
          className={selectedClass?.name || ""}
          startTime={selectedClass?.start_time || new Date().toISOString()}
          duration={
            selectedClass?.start_time && selectedClass?.end_time
              ? Math.round(
                  (new Date(selectedClass.end_time).getTime() -
                    new Date(selectedClass.start_time).getTime()) /
                    (1000 * 60),
                )
              : 60
          }
          spots={
            selectedClass?.max_participants &&
            typeof selectedClass.current_participants === "number"
              ? selectedClass.max_participants -
                selectedClass.current_participants
              : selectedClass?.max_participants || 0
          }
          description={selectedClass?.description}
          instructor={selectedClass?.instructor?.profiles?.display_name}
          capacity={selectedClass?.max_participants}
          bookedSpots={selectedClass?.current_participants || 0}
          clubId={selectedClass?.club_id || ""}
          facilityName={selectedClass?.clubs?.name}
          intensity={selectedClass?.intensity}
        />
      )}

      <CancelConfirmationModal
        visible={showCancelConfirmModal}
        onClose={() => {
          setShowCancelConfirmModal(false);
          setBookingToCancel(null);
        }}
        booking={bookingToCancel}
        onConfirm={handleCancelBooking}
        isLoading={cancelBooking.isPending}
      />
    </SafeAreaWrapper>
  );
}
