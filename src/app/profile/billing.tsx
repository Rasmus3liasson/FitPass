import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import StripePaymentSheet from "@/src/components/StripePaymentSheet";
import { useAuth } from "@/src/hooks/useAuth";
import {
  BillingHistory,
  BillingService,
  Subscription,
} from "@/src/services/BillingService";
import {
  PaymentMethod,
  PaymentMethodService,
} from "@/src/services/PaymentMethodService";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BillingScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBillingData();
    }
  }, [user?.id]);

  const loadBillingData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load subscription, billing history, and payment methods in parallel
      const [subscriptionResult, historyResult, paymentMethodsResult] =
        await Promise.all([
          BillingService.getUserSubscription(user.id),
          BillingService.getBillingHistory(user.id),
          PaymentMethodService.getPaymentMethodsForUser(user.id, user.email),
        ]);

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.subscription || null);
      }

      if (historyResult.success) {
        setBillingHistory(historyResult.history || []);
      }

      if (paymentMethodsResult.success) {
        setPaymentMethods(paymentMethodsResult.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
      Alert.alert("Fel", "Kunde inte ladda faktureringsuppgifter");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBillingData();
    setRefreshing(false);
  };

  const handleCancelSubscription = () => {
    if (!user?.id) return;

    Alert.alert(
      "Avsluta prenumeration",
      "Din prenumeration kommer att avslutas vid slutet av din nuvarande faktureringsperiod. Du behåller åtkomst tills dess.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Avsluta prenumeration",
          style: "destructive",
          onPress: confirmCancelSubscription,
        },
      ]
    );
  };

  const confirmCancelSubscription = async () => {
    if (!user?.id) return;

    try {
      setProcessing(true);
      const result = await BillingService.cancelSubscription(
        user.id,
        "user_requested"
      );

      if (result.success) {
        Alert.alert("Prenumeration avslutad", result.message, [
          { text: "OK", onPress: loadBillingData },
        ]);
      } else {
        Alert.alert("Fel", result.error || "Kunde inte avsluta prenumeration");
      }
    } catch (error) {
      Alert.alert("Fel", "Ett fel uppstod vid avslutning av prenumeration");
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user?.id) return;

    try {
      setProcessing(true);
      const result = await BillingService.reactivateSubscription(user.id);

      if (result.success) {
        Alert.alert("Prenumeration återaktiverad", result.message, [
          { text: "OK", onPress: loadBillingData },
        ]);
      } else {
        Alert.alert(
          "Fel",
          result.error || "Kunde inte återaktivera prenumeration"
        );
      }
    } catch (error) {
      Alert.alert("Fel", "Ett fel uppstod vid återaktivering av prenumeration");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    setShowPaymentSheet(true);
  };

  const handlePaymentMethodAdded = async () => {
    setShowPaymentSheet(false);
    await loadBillingData();
    Alert.alert("Framgång", "Betalningsmetod uppdaterad!");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "trialing":
        return "Testperiod";
      case "canceled":
        return "Avslutad";
      case "past_due":
        return "Förfallen";
      case "incomplete":
        return "Ofullständig";
      default:
        return status;
    }
  };

  const getCardBrandEmoji = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💎";
      case "discover":
        return "🔍";
      default:
        return "💳";
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
      <View className="flex-1 bg-background">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">
              Laddar medlemskapsinformation...
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View className="p-6">
              {/* Membership Overview */}
              <View className="bg-surface rounded-2xl p-6 mb-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">👤</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">
                    Ditt Medlemskap
                  </Text>
                </View>

                {subscription ? (
                  <View className="space-y-4">
                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Plan</Text>
                      <Text className="text-textPrimary font-semibold">
                        {subscription.plan_name}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Status</Text>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          subscription.status === "active"
                            ? "bg-accentGreen/20"
                            : subscription.status === "trialing"
                            ? "bg-accentBlue/20"
                            : subscription.status === "canceled"
                            ? "bg-accentRed/20"
                            : subscription.status === "past_due"
                            ? "bg-accentYellow/20"
                            : "bg-accentGray/20"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            subscription.status === "active"
                              ? "text-accentGreen"
                              : subscription.status === "trialing"
                              ? "text-accentBlue"
                              : subscription.status === "canceled"
                              ? "text-accentRed"
                              : subscription.status === "past_due"
                              ? "text-accentYellow"
                              : "text-textSecondary"
                          }`}
                        >
                          {getStatusText(subscription.status)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Månadsavgift</Text>
                      <Text className="text-textPrimary font-semibold text-xl">
                        {formatAmount(
                          subscription.amount,
                          subscription.currency
                        )}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">
                        Nuvarande period
                      </Text>
                      <Text className="text-textPrimary text-right font-medium">
                        {formatDate(subscription.current_period_start)} -{" "}
                        {formatDate(subscription.current_period_end)}
                      </Text>
                    </View>

                    {subscription.next_billing_date && (
                      <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                        <Text className="text-textSecondary">
                          Nästa faktura
                        </Text>
                        <Text className="text-textPrimary font-medium">
                          {formatDate(subscription.next_billing_date)}
                        </Text>
                      </View>
                    )}

                    {subscription.days_until_renewal && (
                      <View className="flex-row justify-between items-center py-3">
                        <Text className="text-textSecondary">Förnyelse om</Text>
                        <View className="bg-primary/20 px-3 py-1 rounded-full">
                          <Text className="text-primary font-semibold">
                            {subscription.days_until_renewal} dagar
                          </Text>
                        </View>
                      </View>
                    )}

                    {subscription.cancel_at_period_end && (
                      <View className="bg-accentYellow/10 p-4 rounded-xl mt-4 border border-accentYellow/20">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-accentYellow text-lg mr-2">
                            ⚠️
                          </Text>
                          <Text className="text-accentYellow font-bold">
                            Medlemskapet avslutas
                          </Text>
                        </View>
                        <Text className="text-textSecondary text-sm">
                          Ditt medlemskap kommer att avslutas{" "}
                          {formatDate(subscription.current_period_end)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-4">💤</Text>
                    <Text className="text-textSecondary text-lg">
                      Inget aktivt medlemskap
                    </Text>
                    <Text className="text-textSecondary text-sm mt-2">
                      Starta din FitPass-resa idag!
                    </Text>
                  </View>
                )}
              </View>

              {/* Smart Billing Form - Auto-fill from profile */}
              {/*   <SmartBillingForm
                title="Faktureingsuppgifter"
                showAutoFillButton={true}
                onBillingDataReady={(billingDetails) => {
                  console.log("Billing details ready:", billingDetails);
                  // You can use these details for creating payment methods or customers
                }}
              /> */}

              {/* Subscription Actions */}
              {subscription && (
                <View className="flex-row space-x-3 mb-6">
                  {subscription.cancel_at_period_end ? (
                    <TouchableOpacity
                      onPress={handleReactivateSubscription}
                      disabled={processing}
                      className="flex-1 bg-accentGreen rounded-2xl p-4 shadow-lg"
                      style={{
                        shadowColor: "#4CAF50",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <View className="flex-row items-center justify-center">
                        <Text className="text-white text-lg mr-2">🔄</Text>
                        <Text className="text-white font-bold text-center">
                          {processing ? "Återaktiverar..." : "Återaktivera"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : subscription.status === "active" ? (
                    <TouchableOpacity
                      onPress={handleCancelSubscription}
                      disabled={processing}
                      className="flex-1 bg-accentRed rounded-2xl p-4 shadow-lg"
                      style={{
                        shadowColor: "#F44336",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <View className="flex-row items-center justify-center">
                        <Text className="text-white text-lg mr-2">⏸️</Text>
                        <Text className="text-white font-bold text-center">
                          {processing ? "Bearbetar..." : "Avsluta medlemskap"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* Payment Method Section */}
              <View className="bg-surface rounded-2xl p-6 mb-6 border border-accentGray/30">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                      <Text className="text-primary">💳</Text>
                    </View>
                    <Text className="text-lg font-bold text-textPrimary">
                      Betalningsmetod
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleUpdatePaymentMethod}
                    className="bg-primary rounded-full px-6 py-3 shadow-lg"
                    style={{
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                  >
                    <Text className="text-white font-bold">Ändra kort</Text>
                  </TouchableOpacity>
                </View>

                {paymentMethods.length > 0 ? (
                  <View>
                    {paymentMethods.map((pm) => (
                      <View
                        key={pm.id}
                        className="bg-gradient-to-r from-primary to-accentPurple rounded-xl p-6 mb-3 shadow-lg"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <Text className="text-4xl mr-4">
                              {getCardBrandEmoji(pm.card?.brand || "card")}
                            </Text>
                            <View className="flex-1">
                              <Text className="text-white font-bold text-xl capitalize mb-2">
                                {pm.card?.brand} •••• {pm.card?.last4}
                              </Text>
                              <Text className="text-white/80 text-sm mb-1">
                                Utgår{" "}
                                {pm.card?.exp_month
                                  ?.toString()
                                  .padStart(2, "0")}
                                /{pm.card?.exp_year}
                              </Text>
                              {pm.card?.funding && (
                                <Text className="text-white/80 text-sm">
                                  {pm.card.funding === "credit"
                                    ? "Kreditkort"
                                    : pm.card.funding === "debit"
                                    ? "Bankkort"
                                    : pm.card.funding === "prepaid"
                                    ? "Förbetalt kort"
                                    : pm.card.funding}{" "}
                                  • {pm.card?.country || "N/A"}
                                </Text>
                              )}
                            </View>
                          </View>
                          {pm.isDefault && (
                            <View className="bg-white/25 px-3 py-2 rounded-full">
                              <Text className="text-white text-xs font-bold">
                                STANDARD
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}

                    {paymentMethods.length > 0 &&
                      // Might use default property in future
                      !paymentMethods.some((pm) => pm /* .isDefault */) && (
                        <View className="bg-accentYellow/10 p-4 rounded-xl border border-accentYellow/20">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-accentYellow text-lg mr-2">
                              ⚠️
                            </Text>
                            <Text className="text-accentYellow font-bold">
                              Ingen standardbetalningsmetod
                            </Text>
                          </View>
                          <Text className="text-textSecondary text-sm">
                            Lägg till en betalningsmetod för automatiska
                            betalningar
                          </Text>
                        </View>
                      )}

                    {/* Payment Method Features */}
                    <View className="bg-primary/10 p-4 rounded-xl mt-4 border border-primary/20">
                      <Text className="text-primary font-bold mb-2">
                        💡 Betalningsalternativ som stöds:
                      </Text>
                      <View className="space-y-1">
                        <Text className="text-textSecondary text-sm">
                          • Kort (Visa, Mastercard, American Express)
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          • Apple Pay (iPhone/iPad)
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          • Google Pay (Android)
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          • Klarna (för svenska användare)
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          • Andra lokala betalningsmetoder
                        </Text>
                      </View>
                      <Text className="text-primary text-sm mt-2 font-semibold">
                        Tryck på "Ändra kort" för att se alla alternativ via
                        Stripes säkra gränssnitt
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-4">💳</Text>
                    <Text className="text-textSecondary text-lg mb-2">
                      Ingen betalningsmetod sparad
                    </Text>
                    <Text className="text-textSecondary text-sm text-center mb-4">
                      Lägg till ditt kort för att aktivera automatiska
                      betalningar
                    </Text>
                    <TouchableOpacity
                      onPress={handleUpdatePaymentMethod}
                      className="bg-primary px-8 py-4 rounded-full shadow-lg"
                      style={{
                        shadowColor: "#6366F1",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <Text className="text-white font-bold text-lg">
                        Lägg till betalningsmetod
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Billing History */}
              <View className="bg-surface rounded-2xl p-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">📋</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">
                    Fakturahistorik
                  </Text>
                </View>

                {billingHistory.length > 0 ? (
                  <View className="space-y-3">
                    {billingHistory.slice(0, 5).map((invoice, index) => (
                      <View
                        key={invoice.id}
                        className={`flex-row justify-between items-center py-4 ${
                          index < Math.min(billingHistory.length, 5) - 1
                            ? "border-b border-accentGray/20"
                            : ""
                        }`}
                      >
                        <View className="flex-1">
                          <Text className="text-textPrimary font-semibold mb-1">
                            {invoice.description}
                          </Text>
                          <Text className="text-textSecondary text-sm">
                            {formatDate(invoice.date)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-textPrimary font-bold text-lg mb-1">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </Text>
                          <View
                            className={`px-3 py-1 rounded-full ${
                              invoice.status === "paid"
                                ? "bg-accentGreen/20"
                                : invoice.status === "pending"
                                ? "bg-accentYellow/20"
                                : "bg-accentRed/20"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                invoice.status === "paid"
                                  ? "text-accentGreen"
                                  : invoice.status === "pending"
                                  ? "text-accentYellow"
                                  : "text-accentRed"
                              }`}
                            >
                              {invoice.status === "paid"
                                ? "BETALD"
                                : invoice.status === "pending"
                                ? "VÄNTANDE"
                                : "MISSLYCKAD"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {billingHistory.length > 5 && (
                      <TouchableOpacity className="pt-4">
                        <Text className="text-primary text-center font-semibold">
                          Visa alla ({billingHistory.length} fakturor)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-3">📄</Text>
                    <Text className="text-textSecondary">
                      Ingen fakturahistorik tillgänglig
                    </Text>
                  </View>
                )}
              </View>

              {/* Info Section */}
              <View className="bg-primary/10 p-6 rounded-2xl mt-6 border border-primary/20">
                <View className="flex-row items-center mb-3">
                  <Text className="text-primary text-lg mr-2">ℹ️</Text>
                  <Text className="text-primary font-bold text-lg">
                    Medlemskapsinformation
                  </Text>
                </View>
                <View className="space-y-2">
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Medlemskap avslutas alltid vid slutet av din nuvarande
                      faktureringsperiod
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Du behåller full åtkomst tills medlemskapet faktiskt löper
                      ut
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Du kan återaktivera ditt medlemskap när som helst innan
                      det löper ut
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Betalningsuppgifter hanteras säkert av Stripe och
                      krypteras
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaWrapper>
  );
}
