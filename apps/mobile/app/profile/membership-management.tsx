import { AnimatedScreen } from "@shared/components/AnimationProvider";
import { CancelPauseReasonModal } from "@shared/components/membership/CancelPauseReasonModal";
import { DailyAccessStatus } from "@shared/components/membership/DailyAccessComponents";
import { DailyAccessManagementModal } from "@shared/components/membership/DailyAccessManagementModal";
import { PageHeader } from "@shared/components/PageHeader";
import { RecentClassesModal } from "@shared/components/RecentClassesModal";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { Section } from "@shared/components/Section";
import { MembershipManagementSkeleton } from "@shared/components/skeleton";
import { LabelSetting } from "@shared/components/ui/LabelSetting";
import { ROUTES } from "@shared/config/constants";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useUserBookings } from "@shared/hooks/useBookings";
import {
  useDailyAccessGyms,
  useDailyAccessStatus,
} from "@shared/hooks/useDailyAccess";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import {
  useCancelMembership,
  useMembership,
  usePauseMembership,
} from "@shared/hooks/useMembership";
import { useSubscription } from "@shared/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowsClockwise,
  CaretRightIcon,
  ClockCounterClockwise,
  CreditCard,
  Gear,
  Gift,
  PauseCircle
} from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MembershipManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, hideFeedback } =
    useGlobalFeedback();
  const queryClient = useQueryClient();
  const { membership, loading: membershipLoading } = useMembership();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const bookingsQuery = useUserBookings(user?.id || "");
  const bookings = bookingsQuery.data || [];
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUsageHistoryModal, setShowUsageHistoryModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonModalType, setReasonModalType] = useState<"pause" | "cancel">(
    "pause"
  );

  // Daily Access hooks
  const { data: dailyAccessStatus } = useDailyAccessStatus(user?.id);
  const { data: selectedGyms, isLoading: loadingDailyAccess } =
    useDailyAccessGyms(user?.id);
  const [showDailyAccessModal, setShowDailyAccessModal] = useState(false);

  const pauseMembershipMutation = usePauseMembership();
  const cancelMembershipMutation = useCancelMembership();

  const hasDailyAccessFlag = dailyAccessStatus?.hasDailyAccess || false;

  // Auto-open modal if openModal param is present
  useEffect(() => {
    if (params.openModal === "true" && hasDailyAccessFlag) {
      setShowDailyAccessModal(true);
    }
  }, [params.openModal, hasDailyAccessFlag]);

  // Refresh data when screen comes into focus (e.g., returning from facility page)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Force refresh Daily Access queries to ensure hasDailyAccessFlag is up-to-date
        queryClient.invalidateQueries({
          queryKey: ["dailyAccessStatus", user.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["dailyAccessGyms", user.id],
        });
        queryClient.invalidateQueries({ queryKey: ["membership"] });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    }, [user?.id, queryClient])
  );

  const handleDailyAccessModalClose = () => {
    setShowDailyAccessModal(false);
    // Data will automatically refresh due to query invalidation
  };

  const handlePauseWithReason = async (
    reason: string,
    analyticsKey: string
  ) => {
    if (!user?.id) {
      showError("Fel", "Användarinformation saknas.");
      return;
    }

    try {
      await pauseMembershipMutation.mutateAsync({
        userId: user.id,
        reason: reason,
      });

      // Log analytics
      console.log(`📊 Analytics: ${analyticsKey}`, { userId: user.id, reason });

      setShowReasonModal(false);
      showSuccess(
        "Medlemskap pausat",
        "Ditt medlemskap har pausats. Du debiteras inte under pausperioden och kan återaktivera när som helst."
      );
    } catch (error: any) {
      showError(
        "Fel vid pausning",
        error.message || "Kunde inte pausa medlemskapet. Försök igen senare."
      );
    }
  };

  const handleCancelWithReason = async (
    reason: string,
    analyticsKey: string
  ) => {
    if (!user?.id) {
      showError("Fel", "Användarinformation saknas.");
      return;
    }

    try {
      await cancelMembershipMutation.mutateAsync({
        userId: user.id,
        reason: reason,
      });

      // Log analytics
      console.log(`📊 Analytics: ${analyticsKey}`, { userId: user.id, reason });

      setShowReasonModal(false);
      showSuccess(
        "Medlemskap avslutat",
        "Ditt medlemskap kommer att avslutas vid slutet av nuvarande period. Du behåller åtkomst till dess."
      );
    } catch (error: any) {
      showError(
        "Fel vid avslutning",
        error.message || "Kunde inte avsluta medlemskapet. Försök igen senare."
      );
    }
  };

  // Transform bookings data to match RecentClassesModal interface
  const transformedClasses = bookings.map((booking: any) => ({
    id: booking.id,
    name: booking.classes?.name || "Unknown Class",
    facility:
      booking.classes?.clubs?.name || booking.clubs?.name || "Unknown Facility",
    image:
      booking.classes?.clubs?.image_url ||
      booking.clubs?.image_url ||
      "https://via.placeholder.com/100",
    date: booking.classes?.start_time || booking.created_at,
    time: booking.classes?.start_time
      ? new Date(booking.classes.start_time).toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown Time",
    duration:
      booking.classes?.end_time && booking.classes?.start_time
        ? `${Math.round(
            (new Date(booking.classes.end_time).getTime() -
              new Date(booking.classes.start_time).getTime()) /
              (1000 * 60)
          )} min`
        : "Unknown Duration",
    instructor:
      booking.classes?.instructor?.profiles?.display_name ||
      "Unknown Instructor",
    status:
      booking.status === "confirmed"
        ? ("completed" as const)
        : booking.status === "pending"
        ? ("upcoming" as const)
        : booking.status === "cancelled"
        ? ("cancelled" as const)
        : ("completed" as const),
  }));

  const handleAction = async (action: string, route?: string) => {
    setActionLoading(action);

    try {
      if (route) {
        router.push(route as any);
      } else {
        // Handle specific actions
        switch (action) {
          case "pause":
            setReasonModalType("pause");
            setShowReasonModal(true);
            break;
          case "cancel":
            setReasonModalType("cancel");
            setShowReasonModal(true);
            break;
          case "usage-history":
            setShowUsageHistoryModal(true);
            break;
          case "add-credits":
            showSuccess(
              "Framgång!",
              "Denna funktion kommer snart! Du kommer att kunna köpa extra träningskrediter för att utöka ditt medlemskap."
            );
            break;
          default:
            console.log(`Action: ${action}`);
        }
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error);
      showError("Fel", "Ett oväntat fel inträffade. Försök igen senare.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SafeAreaWrapper edges={["top"]}>
      <AnimatedScreen>
        <PageHeader title="" variant="minimal" />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {membershipLoading ? (
            <MembershipManagementSkeleton />
          ) : membership ? (
            <>
              {/* Daily Access Premium - Only show for eligible members */}
              {hasDailyAccessFlag && (
                <Section title="Daily Access Premium">
                  <View className="mx-4 mt-4">
                    <DailyAccessStatus
                      isActive={true}
                      nextCycleDate={
                        subscription?.current_period_end ||
                        new Date().toISOString()
                      }
                      currentSlots={
                        (selectedGyms?.current?.length || 0) +
                        (selectedGyms?.pending?.length || 0)
                      }
                      maxSlots={selectedGyms?.maxSlots || 3}
                    />

                    {/* Manage Button */}
                    <TouchableOpacity
                      onPress={() => setShowDailyAccessModal(true)}
                      className="bg-primary rounded-2xl p-4 flex-row items-center justify-between mt-4"
                      activeOpacity={0.8}
                    >
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base mb-1">
                          Hantera dina klubbar
                        </Text>
                        <Text className="text-white/80 text-sm">
                          {(selectedGyms?.current?.length || 0) +
                            (selectedGyms?.pending?.length || 0)}{" "}
                          av {selectedGyms?.maxSlots || 3} klubbar valda
                          {selectedGyms?.pending?.length
                            ? ` (${selectedGyms.pending.length} väntar)`
                            : ""}
                        </Text>
                      </View>
                      <CaretRightIcon size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </Section>
              )}

              {/* Quick Actions */}
              <Section title="Snabbåtgärder">
                <View className="mx-4 mt-4 bg-surface rounded-2xl p-4">
                  {[
                    {
                      label: "Byt plan",
                      icon: ArrowsClockwise,
                      route: ROUTES.PROFILE_MEMBERSHIP_DETAILS,
                      description: "Uppgradera eller ändra ditt medlemskap",
                    },
                    {
                      label: "Betalningsmetoder",
                      icon: CreditCard,
                      route: ROUTES.PROFILE_BILLING,
                      description: "Hantera kort och betalningar",
                    },
                    {
                      label: "Köp krediter",
                      icon: Gift,
                      action: "add-credits",
                      description: "Lägg till extra träningskrediter",
                    },
                    {
                      label: "Användningshistorik",
                      icon: ClockCounterClockwise,
                      action: "usage-history",
                      description: "Se dina tidigare träningspass",
                    },
                  ].map((item, index) => (
                    <LabelSetting
                      key={index}
                      label={item.label}
                      description={item.description}
                      icon={item.icon}
                      iconColor={colors.primary}
                      iconSize={22}
                      onPress={() =>
                        handleAction(
                          item.action || item.label.toLowerCase(),
                          item.route
                        )
                      }
                      disabled={
                        actionLoading ===
                        (item.action || item.label.toLowerCase())
                      }
                      showBorder={index < 3}
                    />
                  ))}
                </View>
              </Section>

              {/* Membership Perks & Benefits */}
              <Section title="Medlemsförmåner">
                <View className="mx-4 mt-4 bg-primary/5 border border-primary/20 rounded-2xl p-5">
                  <Text className="text-textPrimary font-semibold mb-3">
                    Dina {membership.plan_type || "Premium"} förmåner:
                  </Text>
                  <View className="space-y-3">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                      <Text className="text-textSecondary text-sm">
                        Tillgång till alla träningsanläggningar
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                      <Text className="text-textSecondary text-sm">
                        Obegränsade gruppträningspass
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                      <Text className="text-textSecondary text-sm">
                        Prioriterat stöd och kundservice
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                      <Text className="text-textSecondary text-sm">
                        Rabatter på personlig träning
                      </Text>
                    </View>
                  </View>
                </View>
              </Section>

              {/* Account Settings */}
              <Section title="Kontoinställningar">
                <View className="mx-4 mt-4 bg-surface rounded-2xl p-4">
                  {[
                    {
                      label: "Pausa medlemskap",
                      icon: PauseCircle,
                      action: "pause",
                      description: "Tillfälligt pausa ditt medlemskap",
                      color: colors.primary,
                    },
                    {
                      label: "Avbryt medlemskap",
                      icon: Gear,
                      action: "cancel",
                      description: "Avsluta ditt medlemskap permanent",
                      color: colors.accentRed,
                    },
                  ].map((item, index) => (
                    <LabelSetting
                      key={index}
                      label={item.label}
                      description={item.description}
                      icon={item.icon}
                      iconColor={item.color}
                      iconSize={22}
                      onPress={() => handleAction(item.action)}
                      disabled={
                        actionLoading === item.action ||
                        pauseMembershipMutation.isPending ||
                        cancelMembershipMutation.isPending
                      }
                      showBorder={index === 0}
                      showArrow={false}
                    />
                  ))}
                </View>
              </Section>
            </>
          ) : (
            /* No Membership State */
            <Section title="Inget Medlemskap">
              <View className="mx-4 mt-4 bg-surface rounded-2xl p-6 border border-white/5 items-center">
                <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                  <CreditCard size={32} color={colors.primary} />
                </View>
                <Text className="text-textPrimary text-lg font-bold mb-2 text-center">
                  Inget aktivt medlemskap
                </Text>
                <Text className="text-textSecondary text-center mb-6">
                  Skaffa ett medlemskap för att komma åt alla funktioner och
                  träningsanläggningar.
                </Text>
                <TouchableOpacity
                  className="bg-gradient-to-r from-primary to-primary rounded-2xl py-3 px-6"
                  onPress={() =>
                    router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)
                  }
                >
                  <View className="flex-row items-center">
                    <Text className="text-textPrimary font-bold text-base">
                      Välj medlemskap
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Section>
          )}

          {/* Bottom Padding */}
          <View className="h-12" />
        </ScrollView>
      </AnimatedScreen>

      <RecentClassesModal
        visible={showUsageHistoryModal}
        onClose={() => setShowUsageHistoryModal(false)}
        classes={transformedClasses}
        title="Användningshistorik"
      />

      {/* Daily Access Management Modal */}
      <DailyAccessManagementModal
        visible={showDailyAccessModal}
        onClose={handleDailyAccessModalClose}
        userId={user?.id || ""}
        currentPeriodEnd={subscription?.current_period_end}
        membership={membership ?? undefined}
      />

      {/* Cancel/Pause Reason Modal */}
      <CancelPauseReasonModal
        visible={showReasonModal}
        actionType={reasonModalType}
        onClose={() => setShowReasonModal(false)}
        onConfirm={
          reasonModalType === "pause"
            ? handlePauseWithReason
            : handleCancelWithReason
        }
        isLoading={
          pauseMembershipMutation.isPending ||
          cancelMembershipMutation.isPending
        }
      />
    </SafeAreaWrapper>
  );
}
