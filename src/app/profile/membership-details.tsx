import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { MembershipPlanGrid } from "@/src/components/membership/MembershipPlanGrid";
import { PaymentWarning } from "@/src/components/membership/PaymentWarning";
import { PlanSelectionModal } from "@/src/components/membership/PlanSelectionModal";
import { MembershipCard } from "@/src/components/profile/MembershipCard";
import { useAuth } from "@/src/hooks/useAuth";
import {
  useCreateMembership,
  useMembership,
  useUpdateMembershipPlan,
} from "@/src/hooks/useMembership";
import { useMembershipPlans } from "@/src/hooks/useMembershipPlans";
import { useSubscription } from "@/src/hooks/useSubscription";
import { PaymentMethodService } from "@/src/services/PaymentMethodService";
import { MembershipPlan } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function MembershipDetails() {
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership } = useMembership();
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembershipPlan();

  // State management
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasRealPaymentMethods, setHasRealPaymentMethods] = useState<
    boolean | null
  >(null);
  const [checkingPaymentMethods, setCheckingPaymentMethods] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check payment methods when component focuses
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      const checkPaymentMethods = async () => {
        setCheckingPaymentMethods(true);
        try {
          const result = await PaymentMethodService.getPaymentMethodsForUser(
            user.id
          );
          setHasRealPaymentMethods(result.hasRealPaymentMethods || false);
        } catch (error) {
          console.error("Error checking payment methods:", error);
          setHasRealPaymentMethods(false);
        } finally {
          setCheckingPaymentMethods(false);
        }
      };
      checkPaymentMethods();
    }, [user?.id])
  );

  // Handle plan selection
  const handlePlanSelection = async (plan: MembershipPlan) => {
    if (!user?.id) return;

    // Check if user has payment methods (unless it's a free plan)
    if (plan.price > 0 && hasRealPaymentMethods === false) {
      Alert.alert(
        "Betalningsuppgifter krävs",
        "Du behöver lägga till betalningsuppgifter för att välja ett betalt abonnemang.",
        [
          { text: "Avbryt", style: "cancel" },
          {
            text: "Lägg till betalningsuppgifter",
            onPress: () => router.push("/profile/payments"),
          },
        ]
      );
      return;
    }

    // If payment methods are still loading
    if (hasRealPaymentMethods === null || checkingPaymentMethods) {
      Alert.alert("Vänta", "Kontrollerar betalningsuppgifter...");
      return;
    }

    // Show confirmation modal
    setSelectedPlan(plan);
    setModalVisible(true);
  };

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
      // ALWAYS use createUserMembership function as it handles both create and update logic
      console.log("🔄 Using createUserMembership (handles both create/update)");
      await createMembership.mutateAsync({
        userId: user.id,
        planId: selectedPlan.id,
      });

      Toast.show({
        type: "success",
        text1: membership
          ? "✅ Medlemskap uppdaterat!"
          : "🚀 Medlemskap aktiverat!",
        text2: membership
          ? `Din plan har ändrats till ${selectedPlan.title}`
          : `Välkommen till ${selectedPlan.title}!`,
        position: "top",
        visibilityTime: 4000,
      });

      setModalVisible(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error("Error updating membership:", error);
      Toast.show({
        type: "error",
        text1: "❌ Något gick fel",
        text2: error?.message || "Kunde inte uppdatera medlemskap",
        position: "top",
        visibilityTime: 4000,
      });
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
              onPress={() => router.push("/profile/membership-management")}
            />
          </View>
        )}

        {/* Payment Warning */}
        {hasRealPaymentMethods === false && (
          <PaymentWarning
            onAddPaymentMethod={() => router.push("/profile/payments")}
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
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
