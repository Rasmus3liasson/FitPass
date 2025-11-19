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
import { useSubscription } from "@/src/hooks/useSubscription";
import { MembershipPlan } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function MembershipDetails() {
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership } = useMembership();
  const { subscription } = useSubscription();

  // Debug logging for scheduled changes
  console.log('🔍 Membership state:', {
    hasScheduledChange: !!membership?.scheduledChange,
    confirmed: membership?.scheduledChange?.confirmed,
    planTitle: membership?.scheduledChange?.planTitle
  });
  const { user } = useAuth();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembershipPlan();
  const cancelScheduledChange = useCancelScheduledChange();

  // State management
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();

  // Use React Query for payment methods to ensure consistent caching
  const { 
    data: paymentMethodsResult, 
    isLoading: checkingPaymentMethods,
    refetch: refetchPaymentMethods 
  } = usePaymentMethods(user?.id, user?.email);

  const hasRealPaymentMethods = paymentMethodsResult?.hasRealPaymentMethods || false;

  // Refetch payment methods when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refetchPaymentMethods();
      }
    }, [user?.id, refetchPaymentMethods])
  );

  // Handle plan selection
  const handlePlanSelection = async (plan: MembershipPlan) => {
    if (!user?.id) return;

    // If payment methods are still loading
    if (checkingPaymentMethods) {
      Alert.alert("Vänta", "Kontrollerar betalningsuppgifter...");
      return;
    }

    // Check if user has payment methods (unless it's a free plan)
    if (plan.price > 0 && !hasRealPaymentMethods) {
      Alert.alert(
        "Betalningsuppgifter krävs",
        "Du behöver lägga till betalningsuppgifter för att välja ett betalt abonnemang.",
        [
          { text: "Avbryt", style: "cancel" },
          {
            text: "Lägg till betalningsuppgifter",
            onPress: () => router.push(ROUTES.PROFILE_PAYMENTS as any),
          },
        ]
      );
      return;
    }

    // Show confirmation modal
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  console.log("🎯 MembershipDetails - membership:", membership);
  // Confirm plan selection
  const handleConfirmPlan = async () => {
    if (!selectedPlan || !user?.id) return;

    console.log("🎯 handleConfirmPlan - membership exists:", !!membership);
    console.log("🎯 handleConfirmPlan - membership data:", membership);
    console.log(
      "🎯 handleConfirmPlan - selected plan:",
      selectedPlan.id,
      selectedPlan.title
    );

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
      console.log('🔍 Mutation result:', { 
        result, 
        wasScheduled, 
        hasScheduledChange: !!result?.scheduledChange,
        scheduledChangeConfirmed: result?.scheduledChange?.confirmed,
        scheduledChangeObj: result?.scheduledChange 
      });
      
      if (membership) {
        if (wasScheduled) {
          const nextBillingDate = result.scheduledChange?.nextBillingDate
            ? new Date(result.scheduledChange.nextBillingDate).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'nästa faktureringsperiod';
            
          showSuccess(
            "Planändring schemalagd!",
            `Din plan kommer att ändras till ${selectedPlan.title} den ${nextBillingDate}.`
          );
        } else {
          showSuccess(
            "Medlemskap uppdaterat!",
            `Din plan har ändrats till ${selectedPlan.title}`
          );
        }
      } else {
        showSuccess(
          "Medlemskap aktiverat!",
          `Välkommen till ${selectedPlan.title}!`
        );
      }

      setModalVisible(false);
      setSelectedPlan(null);
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

  console.log("🎯 MembershipDetails - rendering with membership:", membership?.scheduledChange?.confirmed);

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
                  ? new Date(membership.scheduledChange.nextBillingDate).toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'long'
                    })
                  : undefined
              }}
              onPress={() => {
                // Optional: Navigate to detailed view
              }}
              onCancelScheduled={async () => {
                Alert.alert(
                  "Avbryt schemalagd ändring",
                  "Är du säker på att du vill avbryta den schemalagda planändringen?",
                  [
                    { text: "Nej", style: "cancel" },
                    { 
                      text: "Ja, avbryt", 
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await cancelScheduledChange.mutateAsync({
                            membershipId: membership.id,
                            scheduleId: membership.scheduledChange?.scheduleId
                          });
                          showSuccess(
                            "Schemalagd ändring avbruten",
                            "Din planändring har avbrutits och din nuvarande plan fortsätter."
                          );
                        } catch (error: any) {
                          showError(
                            "Kunde inte avbryta ändringen",
                            error?.message || "Något gick fel när vi försökte avbryta den schemalagda ändringen."
                          );
                        }
                      }
                    }
                  ]
                );
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
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
