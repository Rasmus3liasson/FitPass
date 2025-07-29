import { BackButton } from "@/src/components/Button";
import PaymentMethodDetailsModal from "@/src/components/PaymentMethodDetailsModal";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import StripePaymentSheet from "@/src/components/StripePaymentSheet";
import { useAuth } from "@/src/hooks/useAuth";
import { BillingService, Subscription } from "@/src/services/BillingService";
import {
  PaymentMethod,
  PaymentMethodService,
} from "@/src/services/PaymentMethodService";
import { StatusBar } from "expo-status-bar";
import { Calendar, ChevronRight, CreditCard, DollarSign, Plus, Star, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

export default function PaymentScreen() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasRealPaymentMethods, setHasRealPaymentMethods] = useState<boolean>(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const [paymentResult, subscriptionResult, customerResult] = await Promise.all([
        PaymentMethodService.getPaymentMethodsForUser(user.id, user.email),
        BillingService.getUserSubscription(user.id),
        PaymentMethodService.getUserStripeCustomerId(user.id, user.email),
      ]);

      if (paymentResult.success) {
        setPaymentMethods(paymentResult.paymentMethods || []);
        setHasRealPaymentMethods(paymentResult.hasRealPaymentMethods || false);
      }

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.subscription || null);
      }

      if (customerResult.success) {
        setStripeCustomerId(customerResult.customerId || null);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load user data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const loadPaymentMethods = async (customerId: string) => {
    try {
      const result = await PaymentMethodService.getPaymentMethods(customerId);
      if (result.success && result.paymentMethods) {
        setPaymentMethods(result.paymentMethods);
        setHasRealPaymentMethods(result.hasRealPaymentMethods || false);
      }
    } catch (error) {
      // Silent error
    }
  };

  const handlePaymentMethodAdded = async () => {
    await loadUserData();
    setShowPaymentSheet(false);
    Toast.show({
      type: "success",
      text1: "Payment Method Added!",
      text2: "Your new payment method is ready to use.",
      position: "top",
      visibilityTime: 3000,
    });
  };

  const handleViewDetails = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
    setShowDetailsModal(true);
  };

  const handleDetailsUpdated = async () => {
    await loadUserData();
  };

  const handleSetAsDefault = async (paymentMethodId: string) => {
    if (!stripeCustomerId) return;

    setIsProcessing(true);
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Default Payment Updated",
          text2: "Your default payment method has been changed.",
          position: "top",
          visibilityTime: 3000,
        });
        await loadPaymentMethods(stripeCustomerId);
      } else {
        Alert.alert("Error", result.message || "Could not update default payment method");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert("Remove Payment Method", "Are you sure you want to remove this payment method?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true);
          try {
            const result = await PaymentMethodService.deletePaymentMethod(paymentMethodId);
            if (result.success) {
              Toast.show({
                type: "success",
                text1: "Payment Method Removed",
                text2: "The payment method has been deleted.",
                position: "top",
                visibilityTime: 3000,
              });
              if (stripeCustomerId) {
                await loadPaymentMethods(stripeCustomerId);
              }
            } else {
              Alert.alert("Error", result.message || "Could not remove payment method");
            }
          } catch (error) {
            Alert.alert("Error", "An error occurred");
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "trialing":
        return "Trial Period";
      case "canceled":
        return "Canceled";
      case "past_due":
        return "Past Due";
      case "incomplete":
        return "Incomplete";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "trialing":
        return "text-blue-400";
      case "canceled":
        return "text-red-400";
      case "past_due":
        return "text-orange-400";
      case "incomplete":
        return "text-yellow-400";
      default:
        return "text-textSecondary";
    }
  };

  const handleAddCard = () => {
    setShowPaymentSheet(true);
  };

  // Show Stripe Payment Sheet directly when requested
  if (showPaymentSheet) {
    return (
      <StripePaymentSheet
        onPaymentMethodAdded={handlePaymentMethodAdded}
        onClose={() => setShowPaymentSheet(false)}
        /* customerId={stripeCustomerId}
        darkMode={true}  */
      />
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 py-4">
          <BackButton />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">Payment & Billing</Text>
          <Text className="text-textSecondary text-base">Manage your subscription and payment methods</Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">Loading billing information...</Text>
          </View>
        ) : (
          <View className="px-4 pb-6">
            {/* Current Subscription */}
            {subscription && (
              <View className="bg-surface border border-border rounded-2xl p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <DollarSign size={24} color="#6366f1" />
                    <Text className="text-white text-lg font-semibold ml-3">Current Subscription</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${subscription.status === 'active' ? 'bg-green-600' : 'bg-orange-600'}`}>
                    <Text className={`text-xs font-medium ${getStatusColor(subscription.status)} text-white`}>
                      {getStatusText(subscription.status)}
                    </Text>
                  </View>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-textSecondary">Plan</Text>
                    <Text className="text-white font-medium">{subscription.plan_name}</Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <Text className="text-textSecondary">Monthly Cost</Text>
                    <Text className="text-white font-semibold text-lg">
                      {formatAmount(subscription.amount, subscription.currency)}
                    </Text>
                  </View>

                  {subscription.current_period_end && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-textSecondary">Next Billing Date</Text>
                      <View className="flex-row items-center">
                        <Calendar size={16} color="#9ca3af" className="mr-2" />
                        <Text className="text-white font-medium">
                          {formatDate(subscription.current_period_end)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {subscription.cancel_at_period_end && (
                    <View className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-3 mt-3">
                      <Text className="text-orange-400 text-sm font-medium">
                        ⚠️ Subscription will end on {formatDate(subscription.current_period_end)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Payment Methods Section */}
            <View className="bg-surface border border-border rounded-2xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <CreditCard size={24} color="#6366f1" />
                  <Text className="text-white text-lg font-semibold ml-3">Payment Methods</Text>
                </View>
                <TouchableOpacity
                  onPress={handleAddCard}
                  className="bg-indigo-600 rounded-lg px-4 py-2 flex-row items-center"
                  disabled={isProcessing}
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white font-medium ml-2">Add Card</Text>
                </TouchableOpacity>
              </View>

              {paymentMethods.length === 0 ? (
                <View className="py-8 items-center">
                  <CreditCard size={48} color="#6b7280" />
                  <Text className="text-textSecondary text-center mt-4 mb-2">No payment methods added</Text>
                  <Text className="text-textSecondary text-center text-sm mb-4">
                    Add a payment method to manage your subscription
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddCard}
                    className="bg-indigo-600 rounded-lg px-6 py-3"
                  >
                    <Text className="text-white font-medium">Add Your First Card</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-3">
                  {paymentMethods.map((method) => (
                    <View key={method.id} className="bg-background border border-border rounded-lg p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <Text className="text-2xl mr-3">{getCardBrandEmoji(method.card?.brand || "unknown")}</Text>
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-white font-medium">
                                •••• •••• •••• {method.card?.last4}
                              </Text>
                              {method.isDefault && (
                                <View className="ml-2 bg-indigo-600 rounded px-2 py-1">
                                  <Text className="text-white text-xs font-medium">Default</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-textSecondary text-sm mt-1">
                              {method.card?.brand?.toUpperCase()} • Expires {method.card?.exp_month}/{method.card?.exp_year}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center space-x-2">
                          {!method.isDefault && (
                            <TouchableOpacity
                              onPress={() => handleSetAsDefault(method.id)}
                              className="p-2"
                              disabled={isProcessing}
                            >
                              <Star size={20} color="#6b7280" />
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity
                            onPress={() => handleViewDetails(method.id)}
                            className="p-2"
                          >
                            <ChevronRight size={20} color="#6b7280" />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDeletePaymentMethod(method.id)}
                            className="p-2"
                            disabled={isProcessing}
                          >
                            <Trash2 size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Security Notice */}
            <View className="bg-surface/50 border border-border/50 rounded-2xl p-4 mt-6">
              <Text className="text-textSecondary text-sm text-center">
                🔒 Your payment information is secured with industry-standard encryption and processed by Stripe.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {selectedPaymentMethodId && (
        <PaymentMethodDetailsModal
          paymentMethodId={selectedPaymentMethodId}
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