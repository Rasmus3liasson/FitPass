import PaymentMethodDetailsModal from "@/src/components/PaymentMethodDetailsModal";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import StripePaymentSheet from "@/src/components/StripePaymentSheet";
import { useAuth } from "@/src/hooks/useAuth";
import { BillingService, Subscription } from "@/src/services/BillingService";
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
        console.log("❌ No user ID available");
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
      } else {
        console.error("Error loading payment methods:", paymentResult.error);
      }

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.subscription || null);
      }

      if (customerResult.success) {
        setStripeCustomerId(customerResult.customerId || null);
      }

    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Fel", "Kunde inte ladda användardata");
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
      } else {
        console.error("Failed to load payment methods:", result.error);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };

  const handlePaymentMethodAdded = async () => {
    await loadUserData();
    setShowPaymentSheet(false);
    Alert.alert('Framgång', 'Betalningsmetod tillagd!');
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
        Alert.alert("Framgång", "Standardbetalningsmetod uppdaterad");
        await loadPaymentMethods(stripeCustomerId);
      } else {
        Alert.alert(
          "Fel",
          result.message || "Kunde inte uppdatera standardbetalningsmetod"
        );
      }
    } catch (error) {
      Alert.alert("Fel", "Ett fel uppstod");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      "Ta bort betalningsmetod",
      "Är du säker på att du vill ta bort denna betalningsmetod?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await PaymentMethodService.deletePaymentMethod(
                paymentMethodId
              );
              if (result.success) {
                Alert.alert("Framgång", "Betalningsmetod borttagen");
                if (stripeCustomerId) {
                  await loadPaymentMethods(stripeCustomerId);
                }
              } else {
                Alert.alert(
                  "Fel",
                  result.message || "Kunde inte ta bort betalningsmetod"
                );
              }
            } catch (error) {
              Alert.alert("Fel", "Ett fel uppstod");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
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
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'trialing': return 'Testperiod';
      case 'canceled': return 'Avslutad';
      case 'past_due': return 'Förfallen';
      case 'incomplete': return 'Ofullständig';
      default: return status;
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
      <ScrollView 
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Mitt Medlemskap
          </Text>
          <Text className="text-gray-600 mb-6">
            Hantera dina betalningsmetoder och prenumeration
          </Text>

          {loading ? (
            <View className="flex-1 justify-center items-center py-12">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="mt-4 text-gray-600">
                Laddar medlemskapsinformation...
              </Text>
            </View>
          ) : (
            <>
              {/* Subscription Overview */}
              {subscription ? (
                <View className="mb-6">
                  <View 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 shadow-lg"
                    style={{
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-4">
                      <View>
                        <Text className="text-white text-xl font-bold">
                          FitPass Premium
                        </Text>
                        <Text className="text-white/80">
                          Status: {getStatusText(subscription.status)}
                        </Text>
                      </View>
                      <View className="bg-white/20 rounded-full p-3">
                        <Text className="text-white text-2xl">💎</Text>
                      </View>
                    </View>
                    
                    <View className="border-t border-white/20 pt-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-white/80">Månadskostnad:</Text>
                        <Text className="text-white font-bold text-lg">
                          {formatAmount(subscription.amount, subscription.currency)}
                        </Text>
                      </View>
                      
                      {subscription.current_period_end && (
                        <View className="flex-row justify-between items-center">
                          <Text className="text-white/80">
                            {subscription.status === 'canceled' ? 'Slutar:' : 'Förnyas:'}
                          </Text>
                          <Text className="text-white font-semibold">
                            {formatDate(subscription.current_period_end)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View className="bg-blue-50 p-6 rounded-xl mb-6">
                  <Text className="text-blue-800 font-semibold mb-2">
                    🎉 Välkommen till FitPass!
                  </Text>
                  <Text className="text-blue-700 text-sm mb-4">
                    Du har ännu ingen aktiv prenumeration. Lägg till en betalningsmetod för att komma igång.
                  </Text>
                </View>
              )}

              {/* Current Payment Method */}
              {paymentMethods.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Aktuell betalningsmetod
                  </Text>
                  
                  {(() => {
                    const defaultCard = paymentMethods.find(pm => pm.isDefault) || paymentMethods[0];
                    return (
                      <View 
                        className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-5 shadow-lg"
                        style={{
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 5,
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Text className="text-3xl mr-4">
                              {getCardBrandEmoji(defaultCard.card?.brand || "card")}
                            </Text>
                            <View>
                              <Text className="text-white font-bold text-lg capitalize">
                                {defaultCard.card?.brand} •••• {defaultCard.card?.last4}
                              </Text>
                              <Text className="text-gray-300 text-sm">
                                Utgår {defaultCard.card?.exp_month}/{defaultCard.card?.exp_year}
                              </Text>
                            </View>
                          </View>
                          
                          <TouchableOpacity
                            onPress={() => setShowPaymentSheet(true)}
                            className="bg-white/20 px-4 py-2 rounded-lg"
                          >
                            <Text className="text-white font-semibold text-sm">
                              Ändra kort
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Add Payment Method Button */}
              <TouchableOpacity
                onPress={() => setShowPaymentSheet(true)}
                disabled={isProcessing}
                className="bg-green-600 rounded-xl p-4 mb-6 shadow-lg"
                style={{
                  shadowColor: "#16A34A",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-white text-xl mr-2">+</Text>
                  <Text className="text-white font-bold text-lg">
                    {paymentMethods.length === 0 ? 'Lägg till betalningsmetod' : 'Lägg till nytt kort'}
                  </Text>
                </View>
                <Text className="text-white/80 text-center text-sm mt-1">
                  Visa • Mastercard • Apple Pay • Klarna
                </Text>
              </TouchableOpacity>

              {/* All Payment Methods */}
              {paymentMethods.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Alla sparade kort ({paymentMethods.length})
                  </Text>

                  {paymentMethods.map((pm) => (
                    <View
                      key={pm.id}
                      className="border border-gray-200 rounded-lg p-4 mb-3 bg-white"
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-2xl mr-3">
                              {getCardBrandEmoji(pm.card?.brand || "card")}
                            </Text>
                            <View>
                              <View className="flex-row items-center">
                                <Text className="font-semibold text-gray-900 capitalize">
                                  {pm.card?.brand} •••• {pm.card?.last4}
                                </Text>
                                {pm.isDefault && (
                                  <View className="bg-green-100 px-2 py-1 rounded ml-2">
                                    <Text className="text-green-800 text-xs font-medium">
                                      Standard
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-gray-500 text-sm">
                                Utgår {pm.card?.exp_month}/{pm.card?.exp_year}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View className="flex-row">
                          <TouchableOpacity
                            onPress={() => handleViewDetails(pm.id)}
                            className="bg-gray-100 px-3 py-2 rounded mr-2"
                          >
                            <Text className="text-gray-700 text-sm font-medium">
                              Detaljer
                            </Text>
                          </TouchableOpacity>

                          {!pm.isDefault && (
                            <TouchableOpacity
                              onPress={() => handleSetAsDefault(pm.id)}
                              disabled={isProcessing}
                              className="bg-indigo-100 px-3 py-2 rounded mr-2"
                            >
                              <Text className="text-indigo-700 text-sm font-medium">
                                Standard
                              </Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            onPress={() => handleDeletePaymentMethod(pm.id)}
                            disabled={isProcessing}
                            className="bg-red-100 px-3 py-2 rounded"
                          >
                            <Text className="text-red-700 text-sm font-medium">
                              Ta bort
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Information Cards */}
              <View className="bg-green-50 p-4 rounded-lg mb-4">
                <Text className="text-green-800 font-semibold mb-2">
                  � Säker betalning
                </Text>
                <Text className="text-green-700 text-sm">
                  Alla betalningsuppgifter hanteras säkert av Stripe. Vi sparar
                  aldrig dina kortuppgifter på våra servrar.
                </Text>
              </View>

              {process.env.NODE_ENV === "development" && (
                <View className="bg-yellow-50 p-4 rounded-lg">
                  <Text className="text-yellow-800 font-semibold mb-2">
                    🧪 Utvecklingsläge
                  </Text>
                  <Text className="text-yellow-700 text-sm">
                    Du befinner dig i testläge. Inga riktiga betalningar kommer
                    att genomföras.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment Method Details Modal */}
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
