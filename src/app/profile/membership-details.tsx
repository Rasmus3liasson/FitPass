import { BackButton } from "@/src/components/Button";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { SubscriptionPayment } from "@/src/components/SubscriptionPayment";
import SubscriptionSyncManager from "@/src/components/SubscriptionSyncManager";
import { useAuth } from "@/src/hooks/useAuth";
import {
  useCreateMembership,
  useMembership,
  useUpdateMembershipPlan,
} from "@/src/hooks/useMembership";
import { useMembershipPlans } from "@/src/hooks/useMembershipPlans";
import {
  useCancelSubscription,
  useSubscription,
} from "@/src/hooks/useSubscription";
import { useSubscriptionManager } from "@/src/hooks/useSubscriptionManager";
import { updateMembershipPlan } from "@/src/lib/integrations/supabase/queries/membershipQueries";
import { PaymentMethodService } from "@/src/services/PaymentMethodService";
import SubscriptionSyncService from "@/src/services/SubscriptionSyncService";
import { MembershipPlan } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CreditCard, Info, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function MembershipDetails() {
  const { data: plans, isLoading } = useMembershipPlans();
  const { membership } = useMembership();
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembershipPlan();
  const cancelSubscription = useCancelSubscription();

  // Ny subscription manager för Stripe sync
  const {
    plans: stripePlans,
    membership: stripeMembership,
    syncProducts,
    syncSubscriptions,
    isSyncing,
    isSyncingProducts,
    syncError,
    syncProductsError,
    isLoadingPlans,
    refreshPlans,
  } = useSubscriptionManager();

  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasRealPaymentMethods, setHasRealPaymentMethods] = useState<
    boolean | null
  >(null);
  const [checkingPaymentMethods, setCheckingPaymentMethods] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [isSyncingFromStripe, setIsSyncingFromStripe] = useState(false);
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);
  const [syncModalVisible, setSyncModalVisible] = useState(false);

  // New comprehensive sync states
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isCompletingPayments, setIsCompletingPayments] = useState(false);
  const [incompleteSubscriptions, setIncompleteSubscriptions] = useState<any[]>(
    []
  );
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    if (!user?.id) return;
    if (membership) {
      await updateMembershipPlan(user.id, planId);
    } else {
      createMembership.mutate(
        { userId: user.id, planId },
        {
          onSuccess: () => {
            Toast.show({
              type: "success",
              text1: "🚀 Membership Activated!",
              text2:
                "Your new plan is ready! Start exploring fitness facilities now.",
              position: "top",
              visibilityTime: 4000,
            });
          },
          onError: (error: any) => {
            Toast.show({
              type: "error",
              text1: "💳 Activation Failed",
              text2:
                error?.message ||
                "Couldn't activate your membership. Please try again.",
              position: "top",
              visibilityTime: 4000,
            });
          },
        }
      );
    }
  };

  // Sync funktioner
  const handleSyncProducts = async () => {
    try {
      const result = await syncProducts();
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Produkter Synkade!",
          text2: "Alla membership plans är nu synkade med Stripe.",
          position: "top",
          visibilityTime: 3000,
        });
        refreshPlans();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Sync Misslyckades",
        text2: error.message || "Kunde inte synka produkter.",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  // Check payment methods for current user
  const checkUserPaymentMethods = async () => {
    if (!user?.id) {
      console.log("❌ No user ID available for payment method check");
      setHasRealPaymentMethods(false);
      return;
    }

    setCheckingPaymentMethods(true);
    try {
      console.log("🔄 Checking payment methods for user:", user.id);
      // Pass user email to help with customer creation if needed
      const result = await PaymentMethodService.getPaymentMethodsForUser(
        user.id,
        user.email
      );

      if (result.success) {
        console.log("✅ Payment methods check result:", result);
        setHasRealPaymentMethods(result.hasRealPaymentMethods || false);
      } else {
        console.error("❌ Payment methods check failed:", result.error);
        setHasRealPaymentMethods(false);
      }
    } catch (error) {
      console.error("❌ Error checking payment methods:", error);
      setHasRealPaymentMethods(false);
    } finally {
      setCheckingPaymentMethods(false);
    }
  };

  // Check payment methods when user loads
  useEffect(() => {
    if (user?.id) {
      checkUserPaymentMethods();
    }
  }, [user?.id]);

  // Re-check payment methods when screen gets focus (e.g., after adding a payment method)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        checkUserPaymentMethods();
      }
    }, [user?.id])
  );

  // Handle plan selection with payment method check
  const handlePlanSelection = async (plan: MembershipPlan) => {
    if (!user?.id) return;

    // If user doesn't have real payment methods, redirect to payment setup
    if (hasRealPaymentMethods === false) {
      Alert.alert(
        "Betalningsuppgifter Krävs",
        "Du behöver lägga till betalningsuppgifter för att välja ett abonnemang. Vill du gå till betalningssidan?",
        [
          {
            text: "Avbryt",
            style: "cancel",
          },
          {
            text: "Gå till Betalningar",
            onPress: () => {
              router.push("/profile/payments");
            },
          },
        ]
      );
      return;
    }

    // If payment methods check is still loading
    if (hasRealPaymentMethods === null || checkingPaymentMethods) {
      Alert.alert("Vänta", "Kontrollerar betalningsuppgifter...");
      return;
    }

    // Proceed with normal plan selection
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleSyncSubscriptions = async () => {
    try {
      const result = await syncSubscriptions();
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Prenumerationer Synkade!",
          text2: `${result.data?.created || 0} skapade, ${
            result.data?.updated || 0
          } uppdaterade`,
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Sync Misslyckades",
        text2: error.message || "Kunde inte synka prenumerationer.",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  const handleCreateStripeSubscription = async () => {
    if (!user?.id || !membership?.plan_id) {
      Toast.show({
        type: "error",
        text1: "Kan inte skapa prenumeration",
        text2: "Användar-ID eller plan-ID saknas.",
        position: "top",
        visibilityTime: 4000,
      });
      return;
    }

    setIsCreatingSubscription(true);
    try {
      const result =
        await SubscriptionSyncService.createStripeSubscriptionForMembership(
          user.id,
          membership.plan_id
        );

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Stripe Prenumeration Skapad!",
          text2: "Medlemskap har kopplats till Stripe.",
          position: "top",
          visibilityTime: 4000,
        });
        // Uppdatera data
        refreshPlans();
      } else {
        Toast.show({
          type: "error",
          text1: "Kunde inte skapa prenumeration",
          text2: result.error || "Okänt fel uppstod.",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Fel vid skapande",
        text2: error.message || "Kunde inte skapa Stripe prenumeration.",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleSyncFromStripe = async () => {
    setIsSyncingFromStripe(true);
    try {
      const result = await SubscriptionSyncService.syncProductsFromStripe();
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Produkter Synkade från Stripe!",
          text2: `${result.data?.created || 0} skapade, ${
            result.data?.updated || 0
          } uppdaterade`,
          position: "top",
          visibilityTime: 4000,
        });
        // Uppdatera data
        refreshPlans();
      } else {
        Toast.show({
          type: "error",
          text1: "Sync Misslyckades",
          text2: result.error || "Kunde inte synka från Stripe.",
          position: "top",
          visibilityTime: 4000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Sync Misslyckades",
        text2: error.message || "Kunde inte synka från Stripe.",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsSyncingFromStripe(false);
    }
  };

  const loadStripeProducts = async () => {
    try {
      const result = await SubscriptionSyncService.getStripeProducts();
      if (result.success) {
        setStripeProducts(result.data || []);
      }
    } catch (error) {
      console.error("Error loading Stripe products:", error);
    }
  };

  // New comprehensive sync functions
  const handleComprehensiveSync = async () => {
    setIsSyncingAll(true);
    try {
      const result = await SubscriptionSyncService.syncAllSubscriptions();
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "🎉 Comprehensive Sync Complete!",
          text2: result.message || "All subscriptions synced successfully",
          position: "top",
          visibilityTime: 4000,
        });
        // Refresh data
        refreshPlans();
      } else {
        throw new Error(result.error || "Comprehensive sync failed");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Comprehensive Sync Failed",
        text2: error.message || "Could not sync all subscriptions",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  console.log("hasRealPaymentMethods", hasRealPaymentMethods);

  const loadIncompleteSubscriptions = async () => {
    try {
      const result = await SubscriptionSyncService.getIncompleteSubscriptions();
      if (result.success) {
        setIncompleteSubscriptions(result.data || []);
        setShowIncompleteModal(true);
      }
    } catch (error) {
      console.error("Error loading incomplete subscriptions:", error);
    }
  };

  const handleCompletePayment = async (subscriptionId: string) => {
    setIsCompletingPayments(true);
    try {
      const result = await SubscriptionSyncService.completeSubscriptionPayment(
        subscriptionId
      );
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "💳 Payment Completed!",
          text2: result.message || "Subscription payment successful",
          position: "top",
          visibilityTime: 3000,
        });
        // Refresh incomplete subscriptions
        await loadIncompleteSubscriptions();
        refreshPlans();
      } else {
        throw new Error(result.error || "Payment completion failed");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: error.message || "Could not complete payment",
        position: "top",
        visibilityTime: 4000,
      });
    } finally {
      setIsCompletingPayments(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View className="flex-1 bg-background px-4 py-6">
          <BackButton />
          <Text className="text-white mt-4">Loading plans...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="py-4">
          <BackButton />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">
            Membership Plans
          </Text>
          <Text className="text-textSecondary text-base">
            Choose a plan that best fits your fitness goals
          </Text>
        </View>

        {/* Stripe Testing Section */}

        {/* Current Plan Info */}
        {membership && (
          <View className="mt-6 bg-surface rounded-2xl p-4">
            <View className="flex-row items-center space-x-2 mb-2">
              <Info size={16} color="#6366F1" />
              <Text className="text-primary font-medium">Current Plan</Text>
            </View>
            <Text className="text-white text-lg font-semibold mb-1">
              {membership.plan_type} Membership
            </Text>
            <Text className="text-textSecondary">
              {membership.credits - membership.credits_used} credits remaining
            </Text>

            {/* Subscription Status */}
            {subscription && (
              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-textSecondary text-sm">
                  Status:{" "}
                  <Text className="text-primary capitalize">
                    {subscription.status}
                  </Text>
                </Text>
                {subscription.current_period_end && (
                  <Text className="text-textSecondary text-sm">
                    Next billing:{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  </Text>
                )}
                {subscription.cancel_at_period_end && (
                  <Text className="text-yellow-500 text-sm">
                    Subscription will cancel at period end
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Payment Methods Warning */}
        {hasRealPaymentMethods === false && (
          <View className="mt-6 bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <CreditCard size={16} color="#F97316" />
              <Text className="text-orange-400 font-medium ml-2">
                Betalningsuppgifter Krävs
              </Text>
            </View>
            <Text className="text-orange-300 text-sm mb-3">
              För att välja ett nytt abonnemang behöver du först lägga till
              betalningsuppgifter.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/profile/payments")}
              className="bg-orange-600 rounded-lg px-4 py-2 self-start"
            >
              <Text className="text-white text-sm font-medium">
                Lägg till betalningsuppgifter
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available Plans */}
        <View className="mt-6 flex-row flex-wrap justify-between">
          {plans?.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              className="bg-surface rounded-2xl p-6 mb-4"
              style={{ width: "48%" }}
              onPress={() => handlePlanSelection(plan)}
              activeOpacity={0.8}
            >
              <Text className="text-white text-xl font-bold mb-1">
                {plan.title}
              </Text>
              <Text className="text-textSecondary">{plan.description}</Text>
              <Text className="text-white text-2xl font-bold mt-2">
                ${plan.price}
              </Text>
              <Text className="text-textSecondary">per month</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#222",
              borderRadius: 20,
              padding: 24,
              width: 320,
              maxWidth: "90%",
              alignItems: "flex-start",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            {selectedPlan && (
              <>
                <Text className="text-white text-2xl font-bold mb-2">
                  {selectedPlan.title}
                </Text>
                <Text className="text-textSecondary mb-2">
                  {selectedPlan.description}
                </Text>
                <Text className="text-white text-xl font-bold mb-2">
                  ${selectedPlan.price} / month
                </Text>
                <Text className="text-white font-semibold mb-2">Features:</Text>
                {selectedPlan.features.map((feature, idx) => (
                  <Text key={idx} className="text-white mb-1">
                    • {feature}
                  </Text>
                ))}
                <TouchableOpacity
                  style={{
                    backgroundColor: "#6366F1",
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    marginTop: 16,
                    alignSelf: "stretch",
                    alignItems: "center",
                  }}
                  onPress={async () => {
                    if (!user) return;
                    if (membership) {
                      updateMembership.mutate(
                        { userId: user.id, planId: selectedPlan.id },
                        {
                          onSuccess: () => {
                            Toast.show({
                              type: "success",
                              text1: "Membership Updated!",
                              text2: "Your membership plan has been changed.",
                              position: "bottom",
                            });
                          },
                          onError: (error) => {
                            Toast.show({
                              type: "error",
                              text1: "Error",
                              text2:
                                error?.message ||
                                "Could not update membership.",
                              position: "bottom",
                            });
                          },
                        }
                      );
                    } else {
                      createMembership.mutate({
                        userId: user.id,
                        planId: selectedPlan.id,
                      });
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Choose this plan
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onPress={() => setPaymentModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#111827",
              padding: 20,
              borderRadius: 20,
              width: "90%",
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
                Subscribe to Plan
              </Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedPlan && (
              <SubscriptionPayment
                plan={selectedPlan}
                onSuccess={() => {
                  setPaymentModalVisible(false);
                  setSelectedPlan(null);
                }}
                onCancel={() => {
                  setPaymentModalVisible(false);
                  setSelectedPlan(null);
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sync Management Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={syncModalVisible}
        onRequestClose={() => setSyncModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onPress={() => setSyncModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#111827",
              padding: 20,
              borderRadius: 20,
              width: "90%",
              maxHeight: "80%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <SubscriptionSyncManager
              onSyncComplete={() => setSyncModalVisible(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Subscription Management */}
      {subscription && subscription.status === "active" && (
        <View className="mt-6 bg-surface rounded-2xl p-4">
          <Text className="text-white text-lg font-semibold mb-3">
            Subscription Management
          </Text>

          <View className="flex-row space-x-3 mb-3">
            <TouchableOpacity
              className="flex-1 py-3 px-4 bg-purple-600 rounded-lg"
              onPress={() => setSyncModalVisible(true)}
            >
              <Text className="text-white text-center font-medium">
                Detaljerad Sync
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 px-4 bg-red-600 rounded-lg"
              onPress={() => {
                if (subscription.stripe_subscription_id) {
                  cancelSubscription.mutate(
                    {
                      subscriptionId: subscription.stripe_subscription_id,
                      cancelAtPeriodEnd: true,
                    },
                    {
                      onSuccess: () => {
                        Toast.show({
                          type: "success",
                          text1: "Subscription Cancelled",
                          text2:
                            "Your subscription will end at the current period.",
                          position: "top",
                        });
                      },
                    }
                  );
                }
              }}
              disabled={cancelSubscription.isPending}
            >
              <Text className="text-white text-center font-medium">
                {cancelSubscription.isPending ? "Cancelling..." : "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stripe Sync Management - Always Available */}
      {/* <View className="mt-6 bg-surface rounded-2xl p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-semibold">
            Stripe Management
          </Text>
          <TouchableOpacity
            className="py-2 px-4 bg-purple-600 rounded-lg"
            onPress={() => setSyncModalVisible(true)}
          >
            <Text className="text-white text-sm font-medium">
              Öppna Sync Manager
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-textSecondary text-sm">
          Synka produkter och prenumerationer med Stripe för att testa din
          integration.
        </Text>
      </View> */}

      {/* Incomplete Subscriptions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showIncompleteModal}
        onRequestClose={() => setShowIncompleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center p-4"
          onPress={() => setShowIncompleteModal(false)}
        >
          <Pressable className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-96">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">
                Incomplete Subscriptions
              </Text>
              <TouchableOpacity onPress={() => setShowIncompleteModal(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            {incompleteSubscriptions.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-green-500 text-lg font-semibold mb-2">
                  🎉 All Clear!
                </Text>
                <Text className="text-textSecondary text-center">
                  No incomplete subscriptions found. All payments are up to
                  date.
                </Text>
              </View>
            ) : (
              <ScrollView
                className="max-h-64"
                showsVerticalScrollIndicator={false}
              >
                {incompleteSubscriptions.map((sub, index) => (
                  <View
                    key={sub.id}
                    className="bg-background rounded-lg p-4 mb-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-semibold">
                        {sub.plan_type}
                      </Text>
                      <View className="bg-red-600 px-2 py-1 rounded">
                        <Text className="text-white text-xs">
                          {sub.stripe_status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-textSecondary text-sm mb-3">
                      Subscription:{" "}
                      {sub.stripe_subscription_id?.substring(0, 20)}...
                    </Text>

                    <TouchableOpacity
                      className={`py-3 px-4 rounded-lg ${
                        isCompletingPayments ? "bg-gray-600" : "bg-green-600"
                      } flex-row items-center justify-center space-x-2`}
                      onPress={() =>
                        handleCompletePayment(sub.stripe_subscription_id)
                      }
                      disabled={isCompletingPayments}
                    >
                      <CreditCard size={16} color="white" />
                      <Text className="text-white font-medium text-sm">
                        {isCompletingPayments
                          ? "Completing..."
                          : "Complete Payment"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              className="mt-4 py-3 px-4 bg-blue-600 rounded-lg"
              onPress={loadIncompleteSubscriptions}
            >
              <Text className="text-white text-center font-medium">
                Refresh
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaWrapper>
  );
}

/* 

   <View className="mt-4 bg-surface rounded-2xl p-4">
          <View className="flex-row items-center space-x-2 mb-3">
            <Zap size={18} color="#6366F1" />
            <Text className="text-white text-lg font-semibold">
              Stripe Testing
            </Text>
          </View>

          <Text className="text-textSecondary text-sm mb-4">
            Test din Stripe integration genom att synka produkter och
            prenumerationer
          </Text>

          <View className="flex-row space-x-3 mb-3">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg ${
                isSyncingProducts ? "bg-gray-600" : "bg-blue-600"
              } flex-row items-center justify-center space-x-2`}
              onPress={handleSyncProducts}
              disabled={isSyncingProducts}
            >
              <RefreshCw size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                {isSyncingProducts ? "Synkar..." : "DB → Stripe"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg ${
                isSyncingFromStripe ? "bg-gray-600" : "bg-orange-600"
              } flex-row items-center justify-center space-x-2`}
              onPress={handleSyncFromStripe}
              disabled={isSyncingFromStripe}
            >
              <RefreshCw size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                {isSyncingFromStripe ? "Synkar..." : "Stripe → DB"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-3 mb-3">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg ${
                isSyncing ? "bg-gray-600" : "bg-green-600"
              } flex-row items-center justify-center space-x-2`}
              onPress={handleSyncSubscriptions}
              disabled={isSyncing}
            >
              <RefreshCw size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                {isSyncing ? "Synkar..." : "Synka Prenumerationer"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg bg-gray-700 flex-row items-center justify-center space-x-2`}
              onPress={loadStripeProducts}
            >
              <CreditCard size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                Visa Stripe Produkter
              </Text>
            </TouchableOpacity>
          </View>

          
          <View className="flex-row space-x-3 mb-3">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg ${
                isSyncingAll ? "bg-gray-600" : "bg-purple-600"
              } flex-row items-center justify-center space-x-2`}
              onPress={handleComprehensiveSync}
              disabled={isSyncingAll}
            >
              <Zap size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                {isSyncingAll ? "Synkar Allt..." : "🎯 Comprehensive Sync"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-lg bg-yellow-600 flex-row items-center justify-center space-x-2`}
              onPress={loadIncompleteSubscriptions}
            >
              <Info size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                Incomplete Subs
              </Text>
            </TouchableOpacity>
          </View>

          
          {membership && !stripeMembership?.stripe_subscription_id && (
            <TouchableOpacity
              className={`w-full py-3 px-4 rounded-lg ${
                isCreatingSubscription ? "bg-gray-600" : "bg-purple-600"
              } flex-row items-center justify-center space-x-2 mb-3`}
              onPress={handleCreateStripeSubscription}
              disabled={isCreatingSubscription}
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-medium text-sm">
                {isCreatingSubscription
                  ? "Skapar..."
                  : "Skapa Stripe Prenumeration"}
              </Text>
            </TouchableOpacity>
          )}

          
          {syncProductsError && (
            <View className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 mb-2">
              <Text className="text-red-400 text-xs">
                Produkter: {syncProductsError.message}
              </Text>
            </View>
          )}

          {syncError && (
            <View className="p-3 bg-red-500/20 rounded-lg border border-red-500/30 mb-2">
              <Text className="text-red-400 text-xs">
                Prenumerationer: {syncError.message}
              </Text>
            </View>
          )}

          
          {stripeProducts.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-textSecondary text-sm mb-2">
                Stripe Produkter ({stripeProducts.length}):
              </Text>
              {stripeProducts.map((product: any) => (
                <View
                  key={product.id}
                  className="mb-2 p-2 bg-surface/50 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">
                    {product.name}
                  </Text>
                  <Text className="text-textSecondary text-xs">
                    {product.default_price?.unit_amount
                      ? `${(product.default_price.unit_amount / 100).toFixed(
                          0
                        )} SEK/månad`
                      : "Inget pris"}
                  </Text>
                  {product.description && (
                    <Text className="text-textSecondary text-xs mt-1">
                      {product.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          
          {stripePlans && stripePlans.length > 0 && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-textSecondary text-sm mb-2">
                Stripe Plans: {stripePlans.length} funna
              </Text>
              <Text className="text-xs text-textSecondary">
                {stripePlans.filter((p: any) => p.stripe_product_id).length} har
                Stripe Product ID
              </Text>
            </View>
          )}

          
          {stripeMembership && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-textSecondary text-sm mb-1">
                Stripe Medlemskap:
              </Text>
              <Text className="text-white text-sm font-medium">
                {stripeMembership.plan_type} ({stripeMembership.stripe_status})
              </Text>
              <Text className="text-textSecondary text-xs">
                Credits:{" "}
                {stripeMembership.credits - stripeMembership.credits_used}/
                {stripeMembership.credits}
              </Text>

              
              <View className="mt-2 pt-2 border-t border-border/50">
                <View className="flex-row items-center justify-between">
                  <Text className="text-textSecondary text-xs">
                    Betalningsuppgifter:
                  </Text>
                  {checkingPaymentMethods ? (
                    <Text className="text-yellow-400 text-xs">
                      Kontrollerar...
                    </Text>
                  ) : hasRealPaymentMethods === true ? (
                    <View className="flex-row items-center">
                      <Text className="text-green-400 text-xs">
                        ✓ Verifierade
                      </Text>
                    </View>
                  ) : hasRealPaymentMethods === false ? (
                    <View className="flex-row items-center">
                      <Text className="text-orange-400 text-xs">
                        ⚠ Krävs för nya abonnemang
                      </Text>
                      <TouchableOpacity
                        onPress={() => router.push("/profile/payments")}
                        className="ml-2 bg-indigo-600 px-2 py-1 rounded"
                      >
                        <Text className="text-white text-xs">Lägg till</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text className="text-gray-400 text-xs">-</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>


*/
