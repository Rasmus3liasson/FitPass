import PaymentMethodDetailsModal from "@shared/components/PaymentMethodDetailsModal";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { usePaymentMethods } from "@shared/hooks/usePaymentMethods";
import { useStripePaymentSheet } from "@shared/hooks/useStripePaymentSheet";
import { BillingService, Subscription } from "@shared/services/BillingService";
import { PaymentMethodService } from "@shared/services/PaymentMethodService";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import BillingScreen from "./billing";

export default function PaymentScreen() {
  const { user } = useAuth();
  const { showError } = useGlobalFeedback();

  // Use React Query for payment methods
  const {
    data: paymentMethodsResult,
    isLoading: loading,
    refetch: refetchPaymentMethods,
  } = usePaymentMethods(user?.id, user?.email);

  const paymentMethods = paymentMethodsResult?.paymentMethods || [];
  const hasRealPaymentMethods =
    paymentMethodsResult?.hasRealPaymentMethods || false;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { addPaymentMethod, isLoading: isAddingCard } = useStripePaymentSheet({
    onSuccess: async () => {
      await Promise.all([loadUserData(), refetchPaymentMethods()]);
    },
  });

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
      showError("Fel", "Kunde inte ladda användardata");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), refetchPaymentMethods()]);
    setRefreshing(false);
  };

  const loadPaymentMethods = async (customerId: string) => {
    // This function is no longer needed since payment methods are handled by React Query
    // Just refetch the payment methods query
    await refetchPaymentMethods();
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

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4 text-textSecondary">
              Laddar faktureringsinformation...
            </Text>
          </View>
        ) : (
          <BillingScreen />
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
