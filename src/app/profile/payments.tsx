import PaymentMethodDetailsModal from "@/src/components/PaymentMethodDetailsModal";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import StripePaymentSheet from "@/src/components/StripePaymentSheet";
import { useAuth } from "@/src/hooks/useAuth";
import { useGlobalFeedback } from "@/src/hooks/useGlobalFeedback";
import { usePaymentMethods } from "@/src/hooks/usePaymentMethods";
import { BillingService, Subscription } from "@/src/services/BillingService";
import {
    PaymentMethodService
} from "@/src/services/PaymentMethodService";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import BillingScreen from "./billing";

export default function PaymentScreen() {
  const { user } = useAuth();
  
  // Use React Query for payment methods
  const {
    data: paymentMethodsResult,
    isLoading: loading,
    refetch: refetchPaymentMethods,
  } = usePaymentMethods(user?.id, user?.email);

  const paymentMethods = paymentMethodsResult?.paymentMethods || [];
  const hasRealPaymentMethods = paymentMethodsResult?.hasRealPaymentMethods || false;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Load subscription and customer ID (payment methods handled by React Query)
      const [subscriptionResult, customerResult] = await Promise.all([
        BillingService.getUserSubscription(user.id),
        PaymentMethodService.getUserStripeCustomerId(user.id, user.email),
      ]);

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.subscription || null);
      }

      if (customerResult.success) {
        setStripeCustomerId(customerResult.customerId || null);
      }
    } catch (error) {
      Alert.alert("Fel", "Kunde inte ladda användardata");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserData(),
      refetchPaymentMethods(),
    ]);
    setRefreshing(false);
  };

  const loadPaymentMethods = async (customerId: string) => {
    // This function is no longer needed since payment methods are handled by React Query
    // Just refetch the payment methods query
    await refetchPaymentMethods();
  };

  const handlePaymentMethodAdded = async () => {
    await Promise.all([
      loadUserData(),
      refetchPaymentMethods(),
    ]);
    setShowPaymentSheet(false);
    showSuccess("Payment Method Added!", "Your new payment method is ready to use.");
  };

  const handleViewDetails = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
    setShowDetailsModal(true);
  };

  const handleDetailsUpdated = async () => {
    // Reload payment methods after updating details
    await loadUserData();
    // Also reload specifically from customer ID if available for immediate refresh
    if (stripeCustomerId) {
      await loadPaymentMethods(stripeCustomerId);
    }
  };

  if (showPaymentSheet) {
    return (
      <StripePaymentSheet
        onPaymentMethodAdded={handlePaymentMethodAdded}
        onClose={() => setShowPaymentSheet(false)}
      />
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">
              Laddar faktureringsinformation...
            </Text>
          </View>
        ) : (
          <View className="px-4">
            <BillingScreen />
          </View>
        )}
      </ScrollView>

      {/* Payment Method Details Modal */}
      {selectedPaymentMethodId && (
        <PaymentMethodDetailsModal
          paymentMethodId={selectedPaymentMethodId!}
          isVisible={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPaymentMethodId(null);
          }}
          onUpdated={handleDetailsUpdated}
        />
      )}
    </SafeAreaWrapper>
  );
}
