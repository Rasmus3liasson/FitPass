import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { BillingHistoryCard } from "@shared/components/billing/BillingHistoryCard";
import { PaymentMethodsCard } from "@shared/components/billing/PaymentMethodsCard";
import colors from "@shared/constants/custom-colors";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { usePaymentMethods } from "@shared/hooks/usePaymentMethods";
import { useStripePaymentSheet } from "@shared/hooks/useStripePaymentSheet";
import {
  BillingHistory,
  BillingService,
} from "@shared/services/BillingService";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function BillingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showError } = useGlobalFeedback();
  const [refreshing, setRefreshing] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);

  // Use React Query for payment methods
  const {
    data: paymentMethodsResult,
    isLoading: paymentMethodsLoading,
    refetch: refetchPaymentMethods,
  } = usePaymentMethods(user?.id, user?.email);

  const paymentMethods = paymentMethodsResult?.paymentMethods || [];

  const { addPaymentMethod, isLoading: isAddingCard } = useStripePaymentSheet({
    onSuccess: async () => {
      // Wait a bit for Stripe to process
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Refetch payment methods
      await refetchPaymentMethods();
      // Also reload billing history
      await loadBillingHistory();
    },
  });

  useEffect(() => {
    if (user?.id) {
      loadBillingHistory();
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadBillingHistory();
        refetchPaymentMethods();
      }
    }, [user?.id])
  );

  const loadBillingHistory = async () => {
    if (!user?.id) return;

    try {
      const historyResult = await BillingService.getBillingHistory(user.id);

      if (historyResult.success) {
        setBillingHistory(historyResult.history || []);
      }
    } catch (error) {
      console.error("Error loading billing history:", error);
      showError("Fel", "Kunde inte ladda faktureringshistorik");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBillingHistory(), refetchPaymentMethods()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <PageHeader
        title="Fakturering"
        subtitle="Hantera dina betalningsmetoder och fakturor"
        showBackButton={false}
        onBackPress={() => router.back()}
      />

      {paymentMethodsLoading && paymentMethods.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-textSecondary text-base">
            Laddar faktureringsuppgifter...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <PaymentMethodsCard
            paymentMethods={paymentMethods}
            onAddPaymentMethod={addPaymentMethod}
            onRefresh={async () => {
              await refetchPaymentMethods();
            }}
            isLoading={isAddingCard}
          />

          <BillingHistoryCard billingHistory={billingHistory} />
        </ScrollView>
      )}
    </SafeAreaWrapper>
  );
}
