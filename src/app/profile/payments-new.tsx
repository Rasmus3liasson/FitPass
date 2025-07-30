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
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function PaymentScreen() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasRealPaymentMethods, setHasRealPaymentMethods] =
    useState<boolean>(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null);
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

      if (!user?.id) {
        return;
      }

      // Load payment methods, subscription, and customer ID in parallel
      const [paymentResult, subscriptionResult, customerResult] = await Promise.all([
        PaymentMethodService.getPaymentMethodsForUser(user.id, user.email),
        BillingService.getUserSubscription(user.id),
        PaymentMethodService.getUserStripeCustomerId(user.id, user.email)
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
      // Handle error silently or show user-friendly message
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
    // Reload payment methods after updating details
    await loadUserData();
  };

  const handleSetAsDefault = async (paymentMethodId: string) => {
    if (!stripeCustomerId) return;

    setIsProcessing(true);
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(
        stripeCustomerId,
        paymentMethodId
      );
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
        Alert.alert(
          "Error",
          result.message || "Could not update default payment method"
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      "Remove Payment Method",
      "Are you sure you want to remove this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await PaymentMethodService.deletePaymentMethod(
                paymentMethodId
              );
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
                Alert.alert(
                  "Error",
                  result.message || "Could not remove payment method"
                );
              }
            } catch (error) {
              Alert.alert("Error", "An error occurred");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Trial Period';
      case 'canceled': return 'Canceled';
      case 'past_due': return 'Past Due';
      case 'incomplete': return 'Incomplete';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'trialing': return 'text-blue-400';
      case 'canceled': return 'text-red-400';
      case 'past_due': return 'text-orange-400';
      case 'incomplete': return 'text-yellow-400';
      default: return 'text-textSecondary';
    }
  };

  const getNextBillingDate = () => {
    if (!subscription?.current_period_end) return null;
    const nextBilling = new Date(subscription.current_period_end);
    return nextBilling;
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
        {/* Header */}
        <View className="px-4 py-4">
          <BackButton />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">
            Payment & Billing
          </Text>
          <Text className="text-textSecondary text-base">
            Manage your subscription and payment methods
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">
              Loading billing information...
            </Text>
          </View>
        ) : (
          <View className="px-4">
            {/* Current Subscription Card */}
            {subscription ? (
              <View className="mb-6">
                <Text className="text-white text-xl font-semibold mb-4">
                  Current Subscription
                </Text>
                <View className="bg-surface rounded-2xl p-6 border border-border">
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-white text-xl font-bold">
                        FitPass Premium
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View className={`w-2 h-2 rounded-full mr-2 ${
                          subscription.status === 'active' ? 'bg-green-500' : 
                          subscription.status === 'canceled' ? 'bg-red-500' : 'bg-orange-500'
                        }`} />
                        <Text className={`font-medium ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-primary/20 rounded-full p-3">
                      <DollarSign size={24} color="#6366F1" />
                    </View>
                  </View>
                  
                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-textSecondary">Monthly Cost:</Text>
                      <Text className="text-white font-bold text-lg">
                        {formatAmount(subscription.amount, subscription.currency)}
                      </Text>
                    </View>
                    
                    {getNextBillingDate() && (
                      <View className="flex-row justify-between items-center">
                        <Text className="text-textSecondary">
                          {subscription.status === 'canceled' ? 'Ends on:' : 'Next billing:'}
                        </Text>
                        <View className="flex-row items-center">
                          <Calendar size={16} color="#6B7280" />
                          <Text className="text-white font-semibold ml-2">
                            {formatDate(subscription.current_period_end!)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <View className="bg-surface/50 rounded-2xl p-6 border border-border">
                  <Text className="text-primary font-semibold mb-2">
                    🎉 Welcome to FitPass!
                  </Text>
                  <Text className="text-textSecondary text-sm">
                    You don't have an active subscription yet. Add a payment method to get started.
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Methods Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-xl font-semibold">
                  Payment Methods
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPaymentSheet(true)}
                  className="bg-primary rounded-lg px-4 py-2 flex-row items-center space-x-2"
                >
                  <Plus size={16} color="white" />
                  <Text className="text-white font-medium">Add Card</Text>
                </TouchableOpacity>
              </View>

              {paymentMethods.length > 0 ? (
                <View className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <View
                      key={pm.id}
                      className="bg-surface rounded-2xl p-4 border border-border"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="bg-surface/50 rounded-lg p-3 mr-4">
                            <CreditCard size={24} color="#6366F1" />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="text-white font-semibold capitalize">
                                {pm.card?.brand} •••• {pm.card?.last4}
                              </Text>
                              {pm.isDefault && (
                                <View className="flex-row items-center ml-2 bg-primary/20 px-2 py-1 rounded">
                                  <Star size={12} color="#6366F1" />
                                  <Text className="text-primary text-xs font-medium ml-1">
                                    Default
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-textSecondary text-sm mt-1">
                              Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center space-x-2">
                          {!pm.isDefault && (
                            <TouchableOpacity
                              onPress={() => handleSetAsDefault(pm.id)}
                              disabled={isProcessing}
                              className="bg-primary/20 rounded-lg p-2"
                            >
                              <Star size={16} color="#6366F1" />
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity
                            onPress={() => handleViewDetails(pm.id)}
                            className="bg-surface/50 rounded-lg p-2"
                          >
                            <ChevronRight size={16} color="#6B7280" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeletePaymentMethod(pm.id)}
                            disabled={isProcessing}
                            className="bg-red-500/20 rounded-lg p-2"
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowPaymentSheet(true)}
                  className="bg-surface/50 rounded-2xl p-8 border border-dashed border-border items-center"
                >
                  <View className="bg-primary/20 rounded-full p-4 mb-4">
                    <Plus size={32} color="#6366F1" />
                  </View>
                  <Text className="text-white font-semibold text-lg mb-2">
                    Add Your First Payment Method
                  </Text>
                  <Text className="text-textSecondary text-center text-sm">
                    Add a card to start your FitPass subscription and access premium features
                  </Text>
                  <View className="flex-row items-center mt-4 space-x-4">
                    <Text className="text-textSecondary text-xs">💳 Visa</Text>
                    <Text className="text-textSecondary text-xs">💳 Mastercard</Text>
                    <Text className="text-textSecondary text-xs">📱 Apple Pay</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Security Info */}
            <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <View className="bg-green-500/20 rounded-full p-2 mr-3">
                  <Text className="text-green-500">🔒</Text>
                </View>
                <Text className="text-green-400 font-semibold">
                  Secure Payment Processing
                </Text>
              </View>
              <Text className="text-green-300/80 text-sm leading-5">
                All payment information is securely processed by Stripe. We never store your card details on our servers.
              </Text>
            </View>

            {/* Development Mode Notice */}
            {process.env.NODE_ENV === "development" && (
              <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-8">
                <View className="flex-row items-center mb-2">
                  <View className="bg-yellow-500/20 rounded-full p-2 mr-3">
                    <Text className="text-yellow-500">🧪</Text>
                  </View>
                  <Text className="text-yellow-400 font-semibold">
                    Development Mode
                  </Text>
                </View>
                <Text className="text-yellow-300/80 text-sm leading-5">
                  You're in test mode. No real payments will be processed. Use test card 4242 4242 4242 4242.
                </Text>
              </View>
            )}
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
