import { BackButton } from "@/src/components/Button";
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
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Info,
  Plus,
  Receipt,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          colors: ["#10b981", "#059669"],
          textColor: "text-white",
          icon: CheckCircle,
          text: "Aktiv",
        };
      case "trialing":
        return {
          colors: ["#3b82f6", "#2563eb"],
          textColor: "text-white",
          icon: Clock,
          text: "Testperiod",
        };
      case "canceled":
        return {
          colors: ["#ef4444", "#dc2626"],
          textColor: "text-white",
          icon: XCircle,
          text: "Avslutad",
        };
      case "past_due":
        return {
          colors: ["#f59e0b", "#d97706"],
          textColor: "text-white",
          icon: AlertTriangle,
          text: "Förfallen",
        };
      case "incomplete":
        return {
          colors: ["#f59e0b", "#d97706"],
          textColor: "text-white",
          icon: AlertTriangle,
          text: "Ofullständig",
        };
      case "incomplete_expired":
        return {
          colors: ["#ef4444", "#dc2626"],
          textColor: "text-white",
          icon: XCircle,
          text: "Utgången",
        };
      case "unpaid":
        return {
          colors: ["#ef4444", "#dc2626"],
          textColor: "text-white",
          icon: AlertTriangle,
          text: "Obetald",
        };
      default:
        return {
          colors: ["#6b7280", "#4b5563"],
          textColor: "text-white",
          icon: Info,
          text: status,
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <LinearGradient
      colors={config.colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <IconComponent size={14} color="white" />
      <Text className={`text-xs font-bold ml-1 ${config.textColor}`}>
        {config.text}
      </Text>
    </LinearGradient>
  );
};

// Modern Card Component
const ModernCard = ({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) => (
  <View
    className={`bg-surface rounded-3xl p-6 border border-surface/20 ${className}`}
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    }}
  >
    <View className="flex-row items-center mb-6">
      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-4">
        <Icon size={20} color="#6366f1" />
      </View>
      <Text className="text-xl font-bold text-textPrimary">{title}</Text>
    </View>
    {children}
  </View>
);

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
      console.log("hej", subscription);
    }
  }, [user?.id]);

  // Refresh billing data when screen comes into focus (e.g., after updating membership)
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

      console.log("📊 Billing data loaded successfully", {
        subscriptionResult: subscriptionResult,
        subscription: subscriptionResult.subscription,
        history: historyResult.history,
        paymentMethods: paymentMethodsResult.paymentMethods,
      });
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
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}-${year}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("sv-SE").format(amount / 100) + " kr";
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
    <View className="flex-1 bg-background">
      {/* Back Button - Positioned consistently with other screens */}
      <View className="px-6 pt-4 pb-2">
        <BackButton />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View className="items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-6 text-textSecondary text-lg">
              Laddar medlemskapsinformation...
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Membership Overview */}
          <ModernCard title="Ditt Medlemskap" icon={Shield} className="mb-6">
            {subscription ? (
              <View className="space-y-6">
                {/* Plan Name and Status Row */}
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-textPrimary mb-1">
                      {subscription.plan_name}
                    </Text>
                  </View>
                  <StatusBadge status={subscription.status} />
                </View>

                {/* Price */}
                <View className="space-y-4 mt-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-textSecondary">Månadsavgift</Text>
                    </View>
                    <Text className="text-2xl font-bold text-primary">
                      {formatAmount(subscription.amount, subscription.currency)}
                    </Text>
                  </View>
                </View>

                {/* Period Info */}
                <View className="space-y-4">
                  <View className="flex-row items-center justify-between py-3 border-b border-surface/50">
                    <Text className="text-textSecondary">Nuvarande period</Text>
                    <Text className="text-textPrimary font-medium text-right">
                      {formatDate(subscription.current_period_start)} -{" "}
                      {formatDate(subscription.current_period_end)}
                    </Text>
                  </View>

                  {subscription.next_billing_date && (
                    <View className="flex-row items-center justify-between py-3 border-b border-surface/50">
                      <View className="flex-row items-center">
                        <Text className="text-textSecondary mr-2">
                          Nästa faktura
                        </Text>
                        <Calendar size={16} color="#6b7280" />
                      </View>
                      <Text className="text-textPrimary font-medium">
                        {formatDate(subscription.next_billing_date)}
                      </Text>
                    </View>
                  )}

                  {subscription.days_until_renewal && (
                    <View className="flex-row items-center justify-between py-3">
                      <Text className="text-textSecondary">Förnyelse om</Text>
                      <View className="bg-primary/20 px-3 py-1 rounded-full">
                        <Text className="text-primary font-bold">
                          {subscription.days_until_renewal} dagar
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Cancellation Warning */}
                {subscription.cancel_at_period_end && (
                  <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <View className="flex-row items-center mb-2">
                      <AlertTriangle size={20} color="#f59e0b" />
                      <Text className="text-amber-600 font-bold ml-2">
                        Medlemskap avslutas
                      </Text>
                    </View>
                    <Text className="text-textSecondary">
                      Ditt medlemskap kommer att avslutas{" "}
                      {formatDate(subscription.current_period_end)}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-6xl mb-4">💤</Text>
                <Text className="text-xl font-bold text-textPrimary mb-2">
                  Inget aktivt medlemskap
                </Text>
                <Text className="text-textSecondary text-center leading-relaxed">
                  Starta din träningsresa idag!
                </Text>
              </View>
            )}
          </ModernCard>

          {/* Subscription Actions */}
          {subscription && (
            <View className="mb-6">
              {subscription.cancel_at_period_end ? (
                <TouchableOpacity
                  onPress={handleReactivateSubscription}
                  disabled={processing}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 18,
                      paddingHorizontal: 24,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RefreshCw size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {processing
                        ? "Återaktiverar..."
                        : "Återaktivera medlemskap"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : subscription.status === "active" ? (
                <TouchableOpacity
                  onPress={handleCancelSubscription}
                  disabled={processing}
                  activeOpacity={0.8}
                  className="bg-red-500 rounded-2xl p-4"
                  style={{
                    shadowColor: "#ef4444",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center justify-center">
                    <XCircle size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {processing ? "Bearbetar..." : "Avsluta medlemskap"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Payment Methods */}
          <ModernCard
            title="Betalningsmetoder"
            icon={CreditCard}
            className="mb-6"
          >
            {paymentMethods.length > 0 ? (
              <View>
                <Text className="text-textSecondary mb-6">
                  Hantera dina sparade betalningsmetoder
                </Text>
                <View className="space-y-4">
                  {paymentMethods.map((pm) => (
                    <View
                      key={pm.id}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        shadowColor: "#6366f1",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <LinearGradient
                        colors={["#6366f1", "#8b5cf6"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ padding: 20 }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <Text className="text-4xl mr-4">
                              {getCardBrandEmoji(pm.card?.brand || "card")}
                            </Text>
                            <View className="flex-1">
                              <Text className="text-white font-bold text-xl capitalize mb-1">
                                {pm.card?.brand} •••• {pm.card?.last4}
                              </Text>
                              <Text className="text-white/80 text-sm">
                                Utgår{" "}
                                {pm.card?.exp_month
                                  ?.toString()
                                  .padStart(2, "0")}
                                /{pm.card?.exp_year}
                              </Text>
                              {pm.card?.funding && (
                                <Text className="text-white/70 text-xs mt-1">
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
                      </LinearGradient>
                    </View>
                  ))}
                </View>
                
                {/* Update Payment Method Button - Better positioned */}
                <View className="mt-6 pt-6 border-t border-surface/20">
                  <TouchableOpacity
                    onPress={handleUpdatePaymentMethod}
                    activeOpacity={0.8}
                    className="bg-surface/50 rounded-2xl p-4 border border-primary/20"
                    style={{
                      shadowColor: "#6366f1",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <View className="bg-primary/20 p-2 rounded-full mr-3">
                        <CreditCard size={20} color="#6366f1" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-textPrimary font-bold text-lg">
                          Ändra betalningsmetod
                        </Text>
                        <Text className="text-textSecondary text-sm">
                          Uppdatera eller lägg till nytt kort
                        </Text>
                      </View>
                      <View className="bg-primary/10 p-2 rounded-full">
                        <Plus size={16} color="#6366f1" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-4xl mb-4">💳</Text>
                <Text className="text-xl font-bold text-textPrimary mb-2">
                  Ingen betalningsmetod sparad
                </Text>
                <Text className="text-textSecondary text-center mb-6 leading-relaxed">
                  Lägg till ditt kort för att aktivera automatiska betalningar
                </Text>
                <TouchableOpacity
                  onPress={handleUpdatePaymentMethod}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#6366f1",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <LinearGradient
                    colors={["#6366f1", "#8b5cf6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Plus size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      Lägg till betalningsmetod
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ModernCard>

          {/* Billing History */}
          <ModernCard title="Fakturahistorik" icon={Receipt}>
            {billingHistory.length > 0 ? (
              <View className="space-y-4">
                {billingHistory.slice(0, 5).map((invoice, index) => (
                  <View
                    key={invoice.id}
                    className={`flex-row justify-between items-center py-4 ${
                      index < Math.min(billingHistory.length, 5) - 1
                        ? "border-b border-surface/50"
                        : ""
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-textPrimary font-semibold mb-2">
                        {invoice.description}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {formatDate(invoice.date)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-textPrimary font-bold text-lg mb-2">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </Text>
                      <StatusBadge
                        status={
                          invoice.status === "paid"
                            ? "active"
                            : invoice.status === "pending"
                            ? "trialing"
                            : "canceled"
                        }
                      />
                    </View>
                  </View>
                ))}

                {billingHistory.length > 5 && (
                  <TouchableOpacity className="pt-4 items-center">
                    <Text className="text-primary font-semibold">
                      Visa alla ({billingHistory.length} fakturor)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-4xl mb-4">📄</Text>
                <Text className="text-xl font-bold text-textPrimary mb-2">
                  Ingen fakturahistorik
                </Text>
                <Text className="text-textSecondary text-center">
                  Dina fakturor kommer att visas här
                </Text>
              </View>
            )}
          </ModernCard>
        </ScrollView>
      )}
    </View>
  );
}
