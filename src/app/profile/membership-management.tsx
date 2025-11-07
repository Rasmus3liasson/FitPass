import { PageHeader } from "@/components/PageHeader";
import { RecentClassesModal } from "@/components/RecentClassesModal";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { DailyAccessStatus } from "@/src/components/membership/DailyAccessComponents";
import { DailyAccessManagementModal } from "@/src/components/membership/DailyAccessManagementModal";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useUserBookings } from "@/src/hooks/useBookings";
import {
  useDailyAccessGyms,
  useDailyAccessStatus,
} from "@/src/hooks/useDailyAccess";
import { useFeedback } from "@/src/hooks/useFeedback";
import {
  useCancelMembership,
  useMembership,
  usePauseMembership,
} from "@/src/hooks/useMembership";
import { useSubscription } from "@/src/hooks/useSubscription";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  Gift,
  History,
  PauseCircle,
  RefreshCw,
  Settings,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function MembershipManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useFeedback();
  const { membership, loading: membershipLoading } = useMembership();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const bookingsQuery = useUserBookings(user?.id || "");
  const bookings = bookingsQuery.data || [];
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUsageHistoryModal, setShowUsageHistoryModal] = useState(false);

  // Daily Access hooks
  const { data: dailyAccessStatus } = useDailyAccessStatus(user?.id);
  const { data: selectedGyms, isLoading: loadingDailyAccess } =
    useDailyAccessGyms(user?.id);
  const [showDailyAccessModal, setShowDailyAccessModal] = useState(false);

  const pauseMembershipMutation = usePauseMembership();
  const cancelMembershipMutation = useCancelMembership();

  // Use hook for Daily Access status
  const hasDailyAccessFlag = dailyAccessStatus?.hasDailyAccess || false;

  // Refresh data when screen comes into focus (e.g., returning from facility page)
  useFocusEffect(
    useCallback(() => {
      console.log(
        "Membership management screen focused, refreshing Daily Access data..."
      );
      // Data will automatically refetch due to query invalidation
    }, [])
  );

  const handleDailyAccessModalClose = () => {
    setShowDailyAccessModal(false);
    // Data will automatically refresh due to query invalidation
  };

  console.log("Membership:", selectedGyms);
  console.log("Daily Access Status:", {
    hasDailyAccessFlag,
    currentCount: selectedGyms?.current?.length || 0,
    pendingCount: selectedGyms?.pending?.length || 0,
    maxSlots: selectedGyms?.maxSlots || 3,
    totalSelected:
      (selectedGyms?.current?.length || 0) +
      (selectedGyms?.pending?.length || 0),
  });

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
            showError(
              "Pausa medlemskap",
              "Ditt medlemskap kommer att pausas och du kommer inte att debiteras under pausperioden. Du kan återaktivera när som helst.",
              {
                buttonText: "Pausa medlemskap",
                onButtonPress: async () => {
                  if (!subscription?.stripe_subscription_id) {
                    showError(
                      "Fel",
                      "Ingen prenumeration hittades att pausa."
                    );
                    return;
                  }

                  try {
                    await pauseMembershipMutation.mutateAsync({
                      subscriptionId: subscription.stripe_subscription_id,
                    });

                    showSuccess(
                      "Medlemskap pausat",
                      "Ditt medlemskap har pausats framgångsrikt. Du kan återaktivera det när som helst från denna skärm."
                    );
                  } catch (error: any) {
                    showError(
                      "Fel vid pausning",
                      error.message ||
                        "Kunde inte pausa medlemskapet. Försök igen senare."
                    );
                  }
                }
              }
            );
            break;
          case "cancel":
            showError(
              "Avbryt medlemskap",
              "Är du säker på att du vill avbryta ditt medlemskap? Det kommer att avbrytas vid slutet av din nuvarande faktureringsperiod.",
              {
                buttonText: "Avbryt medlemskap",
                onButtonPress: async () => {
                  if (!subscription?.stripe_subscription_id) {
                    showError(
                      "Fel",
                      "Ingen prenumeration hittades att avbryta."
                    );
                    return;
                  }

                  try {
                    await cancelMembershipMutation.mutateAsync({
                      subscriptionId: subscription.stripe_subscription_id,
                      cancelAtPeriodEnd: true,
                    });

                    showSuccess(
                      "Medlemskap avbrutet",
                      "Ditt medlemskap kommer att avbrytas vid slutet av din nuvarande faktureringsperiod. Du har fortfarande tillgång till alla funktioner fram till dess."
                    );
                  } catch (error: any) {
                    showError(
                      "Fel vid avbokning",
                      error.message ||
                        "Kunde inte avbryta medlemskapet. Försök igen senare."
                    );
                  }
                }
              }
            );
            break;
          case "usage-history":
            setShowUsageHistoryModal(true);
            break;
          case "add-credits":
           showSuccess('Framgång!', 'Denna funktion kommer snart! Du kommer att kunna köpa extra träningskrediter för att utöka ditt medlemskap.');
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
            /* Loading Skeleton */
            <>
              <Section title="Nuvarande Plan">
                <View className="mx-4 mt-4">
                  <View className="bg-surface rounded-3xl p-6 border border-white/5">
                    <View className="flex-row items-center justify-between mb-4">
                      <View>
                        <View className="bg-white/10 rounded h-3 w-20 mb-2" />
                        <View className="bg-white/10 rounded h-6 w-24" />
                      </View>
                      <View className="bg-white/10 rounded-full w-16 h-6" />
                    </View>
                    <View className="flex-row gap-3 mb-4">
                      <View className="flex-1 bg-white/5 rounded-2xl p-4">
                        <View className="bg-white/10 rounded h-4 w-16 mb-2" />
                        <View className="bg-white/10 rounded h-5 w-12 mb-1" />
                        <View className="bg-white/10 rounded h-3 w-20" />
                      </View>
                      <View className="flex-1 bg-white/5 rounded-2xl p-4">
                        <View className="bg-white/10 rounded h-4 w-16 mb-2" />
                        <View className="bg-white/10 rounded h-5 w-12 mb-1" />
                        <View className="bg-white/10 rounded h-3 w-20" />
                      </View>
                    </View>
                    <View className="bg-white/10 rounded-full h-2 w-full" />
                  </View>
                </View>
              </Section>

              <Section title="Snabbåtgärder">
                <View className="mx-4 mt-4 space-y-2">
                  {[1, 2, 3, 4].map((index) => (
                    <View
                      key={index}
                      className="bg-surface rounded-2xl p-4 border border-white/5"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-white/10 rounded-full mr-4" />
                        <View className="flex-1">
                          <View className="bg-white/10 rounded h-4 w-24 mb-2" />
                          <View className="bg-white/10 rounded h-3 w-32" />
                        </View>
                        <View className="bg-white/10 rounded w-5 h-5" />
                      </View>
                    </View>
                  ))}
                </View>
              </Section>
            </>
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
                          Hantera dina gym
                        </Text>
                        <Text className="text-white/80 text-sm">
                          {(selectedGyms?.current?.length || 0) +
                            (selectedGyms?.pending?.length || 0)}{" "}
                          av {selectedGyms?.maxSlots || 3} gym valda
                          {selectedGyms?.pending?.length
                            ? ` (${selectedGyms.pending.length} väntar)`
                            : ""}
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </Section>
              )}

              {/* Quick Actions */}
              <Section title="Snabbåtgärder">
                <View className="mx-4 mt-4 space-y-3">
                  {[
                    {
                      label: "Byt plan",
                      icon: RefreshCw,
                      route: ROUTES.PROFILE_MEMBERSHIP_DETAILS,
                      description: "Uppgradera eller ändra ditt medlemskap",
                      color: "#6366F1",
                    },
                    {
                      label: "Betalningsmetoder",
                      icon: CreditCard,
                      route: "/profile/billing",
                      description: "Hantera kort och betalningar",
                      color: "#6366F1",
                    },
                    {
                      label: "Köp krediter",
                      icon: Gift,
                      action: "add-credits",
                      description: "Lägg till extra träningskrediter",
                      color: "#6366F1",
                    },
                    {
                      label: "Användningshistorik",
                      icon: History,
                      action: "usage-history",
                      description: "Se dina tidigare träningspass",
                      color: "#6366F1",
                    },
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-surface rounded-2xl p-5 border border-white/5 my-2"
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
                      style={{
                        opacity:
                          actionLoading ===
                          (item.action || item.label.toLowerCase())
                            ? 0.6
                            : 1,
                      }}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-14 h-14 rounded-full items-center justify-center mr-5"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <item.icon size={22} color={item.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-textPrimary text-base font-semibold mb-1">
                            {item.label}
                          </Text>
                          <Text className="text-textSecondary text-sm">
                            {item.description}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#A0A0A0" />
                      </View>
                    </TouchableOpacity>
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
                <View className="mx-4 mt-4 space-y-3">
                  {[
                    {
                      label: "Pausa medlemskap",
                      icon: PauseCircle,
                      action: "pause",
                      description: "Tillfälligt pausa ditt medlemskap",
                      color: "#6366F1",
                      destructive: false,
                    },
                    {
                      label: "Avbryt medlemskap",
                      icon: Settings,
                      action: "cancel",
                      description: "Avsluta ditt medlemskap permanent",
                      color: "#EF4444",
                      destructive: true,
                    },
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="bg-surface rounded-2xl p-5 border border-white/5 my-2"
                      onPress={() => handleAction(item.action)}
                      disabled={
                        actionLoading === item.action ||
                        pauseMembershipMutation.isPending ||
                        cancelMembershipMutation.isPending
                      }
                      style={{
                        opacity:
                          actionLoading === item.action ||
                          (item.action === "pause" &&
                            pauseMembershipMutation.isPending) ||
                          (item.action === "cancel" &&
                            cancelMembershipMutation.isPending)
                            ? 0.6
                            : 1,
                      }}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-14 h-14 rounded-full items-center justify-center mr-5"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <item.icon size={22} color={item.color} />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-base font-semibold mb-1 ${
                              item.destructive
                                ? "text-red-500"
                                : "text-textPrimary"
                            }`}
                          >
                            {item.label}
                          </Text>
                          <Text className="text-textSecondary text-sm">
                            {item.description}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#A0A0A0" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Section>

              {/* Subscription Status Alerts */}
              {subscription && (
                <>
                  {subscription.cancel_at_period_end && (
                    <Section title="Viktig information">
                      <View className="mx-4 mt-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                        <View className="flex-row items-center mb-2">
                          <View className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                          <Text className="text-orange-500 font-semibold">
                            Medlemskap avbryts snart
                          </Text>
                        </View>
                        <Text className="text-textSecondary text-sm">
                          Ditt medlemskap kommer att avbrytas vid slutet av din
                          nuvarande faktureringsperiod. Du har fortfarande
                          tillgång till alla funktioner fram till dess.
                        </Text>
                      </View>
                    </Section>
                  )}

                  {subscription.status === "past_due" && (
                    <Section title="Betalningsvarning">
                      <View className="mx-4 mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                        <View className="flex-row items-center mb-2">
                          <View className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                          <Text className="text-red-500 font-semibold">
                            Betalning misslyckades
                          </Text>
                        </View>
                        <Text className="text-textSecondary text-sm">
                          Din senaste betalning misslyckades. Uppdatera din
                          betalningsmetod för att undvika avbrott i tjänsten.
                        </Text>
                        <TouchableOpacity
                          className="mt-3 bg-red-500 rounded-xl py-2 px-4 self-start"
                          onPress={() => router.push("/profile/billing" as any)}
                        >
                          <Text className="text-white font-semibold text-sm">
                            Uppdatera betalning
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Section>
                  )}
                </>
              )}
            </>
          ) : (
            /* No Membership State */
            <Section title="Inget Medlemskap">
              <View className="mx-4 mt-4 bg-surface rounded-2xl p-6 border border-white/5 items-center">
                <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
                  <CreditCard size={32} color="#6366F1" />
                </View>
                <Text className="text-textPrimary text-lg font-bold mb-2 text-center">
                  Inget aktivt medlemskap
                </Text>
                <Text className="text-textSecondary text-center mb-6">
                  Skaffa ett medlemskap för att komma åt alla funktioner och
                  träningsanläggningar.
                </Text>
                <TouchableOpacity
                  className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl py-3 px-6"
                  onPress={() =>
                    router.push(ROUTES.PROFILE_MEMBERSHIP_DETAILS as any)
                  }
                >
                  <View className="flex-row items-center">
                    <Calendar size={18} color="#ffffff" />
                    <Text className="text-white font-bold text-base ml-2">
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
      />
    </SafeAreaWrapper>
  );
}
