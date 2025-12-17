import { CustomAlert } from "@/components/CustomAlert";
import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { MembershipPlanGrid } from "@/src/components/membership/MembershipPlanGrid";
import { PaymentWarning } from "@/src/components/membership/PaymentWarning";
import { PlanSelectionModal } from "@/src/components/membership/PlanSelectionModal";
import { MembershipCard } from "@/src/components/profile/MembershipCard";
import { ROUTES } from "@/src/config/constants";
import { useAuth } from "@/src/hooks/useAuth";
import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import {
    useCancelScheduledChange,
    useCreateMembership,
    useMembership,
    useUpdateMembershipPlan,
} from "@/src/hooks/useMembership";
import { useMembershipPlans } from "@/src/hooks/useMembershipPlans";
import { usePaymentMethods } from "@/src/hooks/usePaymentMethods";
import { useScheduledChanges } from "@/src/hooks/useScheduledChanges";
import { useSubscription } from "@/src/hooks/useSubscription";
import { MembershipPlan } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function MembershipDetails() {
  const queryClient = useQueryClient();
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership, refetch: refetchMembership } = useMembership();
  const { subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const { user } = useAuth();
  const { scheduledChangeData, hasScheduledChange, scheduledChange } =
    useScheduledChanges(user?.id || null);
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembershipPlan();
  const cancelScheduledChange = useCancelScheduledChange();

  // State management
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }>;
    type?: "default" | "destructive" | "warning";
  }>({ visible: false, title: "" });
  const { showSuccess, showError } = useGlobalFeedback();

  // Use React Query for payment methods to ensure consistent caching
  const {
    data: paymentMethodsResult,
    isLoading: checkingPaymentMethods,
    refetch: refetchPaymentMethods,
  } = usePaymentMethods(user?.id, user?.email);

  const hasRealPaymentMethods =
    paymentMethodsResult?.hasRealPaymentMethods || false;

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Invalidate queries to force refetch from server
        queryClient.invalidateQueries({ queryKey: ["membership"] });
        queryClient.invalidateQueries({ queryKey: ["subscription", user.id] });
        queryClient.invalidateQueries({ queryKey: ["paymentMethods", user.id] });
        
        // Then refetch
        refetchPaymentMethods();
        refetchMembership();
        refetchSubscription();
      }
    }, [user?.id, queryClient, refetchPaymentMethods, refetchMembership, refetchSubscription])
  );

  // Handle plan selection
  const handlePlanSelection = async (plan: MembershipPlan) => {
    if (!user?.id) return;

    // If payment methods are still loading
    if (checkingPaymentMethods) {
      showError("Vänta", "Kontrollerar betalningsuppgifter...");
      return;
    }

    // Check if user has payment methods (unless it's a free plan)
    if (plan.price > 0 && !hasRealPaymentMethods) {
      showError(
        "Betalningsuppgifter krävs",
        "Du behöver lägga till betalningsuppgifter för att välja ett betalt abonnemang. Tryck här för att lägga till.",
        () => router.push(ROUTES.PROFILE_PAYMENTS as any)
      );
      return;
    }

    // Show confirmation modal
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  // Confirm plan selection
  const handleConfirmPlan = async () => {
    if (!selectedPlan || !user?.id) return;

    setIsProcessing(true);
    try {
      let result;

      if (membership) {
        // Update existing membership
        result = await updateMembership.mutateAsync({
          userId: user.id,
          planId: selectedPlan.id,
        });
      } else {
        // Create new membership
        result = await createMembership.mutateAsync({
          userId: user.id,
          planId: selectedPlan.id,
        });
      }

      // Check if this was a scheduled change
      const wasScheduled = result?.scheduledChange?.confirmed;
      const webhookPending = result?.webhookPending;

      if (membership) {
        if (wasScheduled) {
          const nextBillingDate = result.scheduledChange?.nextBillingDate
            ? new Date(
                result.scheduledChange.nextBillingDate
              ).toLocaleDateString("sv-SE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "nästa faktureringsperiod";

          showSuccess(
            "Planändring schemalagd!",
            `Din plan kommer att ändras till ${selectedPlan.title} den ${nextBillingDate}.`
          );
        } else if (webhookPending) {
          // Webhook-based update in progress
          showSuccess(
            "Uppdaterar medlemskap...",
            `Din plan ändras till ${selectedPlan.title}. Detta kan ta några sekunder.`
          );
        } else {
          showSuccess(
            "Medlemskap uppdaterat!",
            `Din plan har ändrats till ${selectedPlan.title}`
          );
        }
      } else {
        // New membership created
        if (webhookPending) {
          // Webhook-based creation in progress
          showSuccess(
            "Skapar medlemskap...",
            `Aktiverar ${selectedPlan.title}. Detta kan ta några sekunder.`
          );
        } else {
          showSuccess(
            "Medlemskap aktiverat!",
            `Välkommen till ${selectedPlan.title}!`
          );
        }
      }

      setModalVisible(false);
      setSelectedPlan(null);

      // React Query will automatically invalidate and refetch
      // If webhook is pending, the hook will poll for completion
      // due to the onSuccess handler in useCreateMembership/useUpdateMembershipPlan
    } catch (error: any) {
      console.error("Error updating membership:", error);
      showError(
        "Något gick fel",
        error?.message || "Kunde inte uppdatera medlemskap"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel scheduled change
  const handleCancelScheduledChange = async () => {
    if (!user?.id || !membership?.id) return;

    setAlertConfig({
      visible: true,
      title: "Avbryt schemalagd ändring",
      message:
        "Är du säker på att du vill avbryta din schemalagda planändring?",
      type: "warning",
      buttons: [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Ja, avbryt ändring",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelScheduledChange.mutateAsync({
                membershipId: membership.id,
              });
              showSuccess(
                "Ändring avbruten",
                "Din schemalagda planändring har avbrutits"
              );
            } catch (error: any) {
              showError(
                "Något gick fel",
                error?.message || "Kunde inte avbryta den schemalagda ändringen"
              );
            }
          },
        },
      ],
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <StatusBar style="light" />
        <View className="flex-1 bg-background justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textPrimary text-lg font-semibold mt-4">
            Laddar medlemskapsplaner...
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <PageHeader
          title="Medlemskap"
          subtitle="Välj en plan som passar dina träningsmål och få tillgång till Stockholms bästa träningsanläggningar"
        />

        {/* Current Membership Card */}
        {membership && (
          <View className="px-4">
            <MembershipCard
              membership={membership}
              subscription={subscription}
              onPress={() =>
                router.push(ROUTES.PROFILE_MEMBERSHIP_MANAGEMENT as any)
              }
            />
          </View>
        )}

        {/* Scheduled Membership Change Card */}
        {membership?.scheduledChange?.confirmed && (
          <View className="px-4">
            <MembershipCard
              membership={null}
              isScheduled={true}
              scheduledPlan={{
                planTitle: membership.scheduledChange.planTitle,
                planCredits: membership.scheduledChange.planCredits,
                nextBillingDate: membership.scheduledChange.nextBillingDate
                  ? new Date(
                      membership.scheduledChange.nextBillingDate
                    ).toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "long",
                    })
                  : undefined,
              }}
              onPress={() => {
                // Optional: Navigate to detailed view
              }}
              onCancelScheduled={async () => {
                setAlertConfig({
                  visible: true,
                  title: "Avbryt schemalagd ändring",
                  message:
                    "Är du säker på att du vill avbryta den schemalagda planändringen?",
                  type: "warning",
                  buttons: [
                    { text: "Nej", style: "cancel" },
                    {
                      text: "Ja, avbryt",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await cancelScheduledChange.mutateAsync({
                            membershipId: membership.id,
                            scheduleId: membership.scheduledChange?.scheduleId,
                          });
                          showSuccess(
                            "Schemalagd ändring avbruten",
                            "Din planändring har avbrutits och din nuvarande plan fortsätter."
                          );
                        } catch (error: any) {
                          showError(
                            "Kunde inte avbryta ändringen",
                            error?.message ||
                              "Något gick fel när vi försökte avbryta den schemalagda ändringen."
                          );
                        }
                      },
                    },
                  ],
                });
              }}
            />
          </View>
        )}

        {/* Payment Warning */}
        {!checkingPaymentMethods && !hasRealPaymentMethods && (
          <PaymentWarning
            onAddPaymentMethod={() =>
              router.push(ROUTES.PROFILE_PAYMENTS as any)
            }
          />
        )}

        {/* Membership Plans Grid */}
        <View className="px-4">
          <MembershipPlanGrid
            plans={plans || []}
            currentMembership={membership}
            onPlanSelect={handlePlanSelection}
            isLoading={isLoading}
            scheduledChangeData={{ hasScheduledChange, scheduledChange }}
          />
        </View>

        {/* Plan Selection Modal */}
        <PlanSelectionModal
          visible={modalVisible}
          selectedPlan={selectedPlan}
          onClose={() => {
            setModalVisible(false);
            setSelectedPlan(null);
          }}
          onConfirm={handleConfirmPlan}
          isLoading={isProcessing}
          hasExistingMembership={!!membership}
          currentMembership={membership}
          scheduledChangeData={{ hasScheduledChange, scheduledChange }}
        />
        {/* Custom Alert */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig({ visible: false, title: "" })}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
