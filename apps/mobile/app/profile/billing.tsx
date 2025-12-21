import { PageHeader } from "@/components/PageHeader";
import { BillingHistoryCard } from "@shared/components/billing/BillingHistoryCard";
import { PaymentMethodsCard } from "@shared/components/billing/PaymentMethodsCard";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import StripePaymentSheet from "@shared/components/StripePaymentSheet";
import { useAuth } from "@shared/hooks/useAuth";
import { useGlobalFeedback } from "@shared/hooks/useGlobalFeedback";
import { BillingHistory, BillingService } from "@shared/services/BillingService";
import {
  PaymentMethod,
  PaymentMethodService,
} from "@shared/services/PaymentMethodService";
import { useFocusEffect } from "expo-router";
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
  const { user } = useAuth();
  const { showError } = useGlobalFeedback();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBillingData();
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadBillingData();
      }
    }, [user?.id])
  );

  const loadBillingData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [historyResult, paymentMethodsResult] = await Promise.all([
        BillingService.getBillingHistory(user.id),
        PaymentMethodService.getPaymentMethodsForUser(user.id, user.email),
      ]);

      if (historyResult.success) {
        setBillingHistory(historyResult.history || []);
      }

      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
      showError("Fel", "Kunde inte ladda faktureringsuppgifter");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBillingData();
    setRefreshing(false);
  };

  const handlePaymentMethodAdded = async () => {
    setShowPaymentSheet(false);
    await loadBillingData();
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
      <PageHeader
        title="Fakturering"
        subtitle="Hantera dina betalningsmetoder och fakturor"
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
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
              tintColor="#6366f1"
            />
          }
        >
          <PaymentMethodsCard
            paymentMethods={paymentMethods}
            onAddPaymentMethod={() => setShowPaymentSheet(true)}
            onRefresh={loadBillingData}
          />

          <BillingHistoryCard billingHistory={billingHistory} />
        </ScrollView>
      )}
    </SafeAreaWrapper>
  );
}
