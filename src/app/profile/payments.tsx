import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import StripePaymentSheet from '@/src/components/StripePaymentSheet';
import { useAuth } from '@/src/hooks/useAuth';
import { PaymentMethod, PaymentMethodService } from '@/src/services/PaymentMethodService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface UserMembership {
  stripe_customer_id: string;
}

export default function PaymentScreen() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [hasRealPaymentMethods, setHasRealPaymentMethods] = useState<boolean>(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [loading, setLoading] = useState(true);
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
        console.log('❌ No user ID available');
        return;
      }

      // Use the new user-based payment method service
      const result = await PaymentMethodService.getPaymentMethodsForUser(
        user.id, 
        user.email
      );
      
      if (result.success) {
        setPaymentMethods(result.paymentMethods || []);
        // Also get the customer ID for other operations
        const customerResult = await PaymentMethodService.getUserStripeCustomerId(
          user.id, 
          user.email
        );
        if (customerResult.success) {
          setStripeCustomerId(customerResult.customerId || null);
        }
      } else {
        console.error('Error loading payment methods:', result.error);
        Alert.alert('Fel', 'Kunde inte ladda betalningsmetoder');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Fel', 'Kunde inte ladda användardata');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async (customerId: string) => {
    try {
      const result = await PaymentMethodService.getPaymentMethods(customerId);
      if (result.success && result.paymentMethods) {
        setPaymentMethods(result.paymentMethods);
        setHasRealPaymentMethods(result.hasRealPaymentMethods || false);
      } else {
        console.error('Failed to load payment methods:', result.error);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handlePaymentMethodAdded = async () => {
    // Simply reload payment methods after adding a new one
    await loadUserData();
    setShowPaymentSheet(false);
  };

  const handleSetAsDefault = async (paymentMethodId: string) => {
    if (!stripeCustomerId) return;

    setIsProcessing(true);
    try {
      const result = await PaymentMethodService.setDefaultPaymentMethod(stripeCustomerId, paymentMethodId);
      if (result.success) {
        Alert.alert('Framgång', 'Standardbetalningsmetod uppdaterad');
        await loadPaymentMethods(stripeCustomerId);
      } else {
        Alert.alert('Fel', result.message || 'Kunde inte uppdatera standardbetalningsmetod');
      }
    } catch (error) {
      Alert.alert('Fel', 'Ett fel uppstod');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      'Ta bort betalningsmetod',
      'Är du säker på att du vill ta bort denna betalningsmetod?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await PaymentMethodService.deletePaymentMethod(paymentMethodId);
              if (result.success) {
                Alert.alert('Framgång', 'Betalningsmetod borttagen');
                if (stripeCustomerId) {
                  await loadPaymentMethods(stripeCustomerId);
                }
              } else {
                Alert.alert('Fel', result.message || 'Kunde inte ta bort betalningsmetod');
              }
            } catch (error) {
              Alert.alert('Fel', 'Ett fel uppstod');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const getCardBrandEmoji = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💎';
      case 'discover': return '🔍';
      default: return '💳';
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
      <ScrollView className="flex-1 bg-white">
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Betalningsmetoder</Text>
          <Text className="text-gray-600 mb-6">
            Hantera dina sparade betalningsmetoder för FitPass-prenumerationer
          </Text>

          {loading ? (
            <View className="flex-1 justify-center items-center py-12">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="mt-4 text-gray-600">Laddar betalningsmetoder...</Text>
            </View>
          ) : !stripeCustomerId ? (
            <View className="bg-yellow-50 p-4 rounded-lg mb-6">
              <Text className="text-yellow-800 font-semibold mb-2">Ingen aktiv prenumeration</Text>
              <Text className="text-yellow-700 text-sm">
                Du behöver ha en aktiv prenumeration för att hantera betalningsmetoder.
              </Text>
            </View>
          ) : (
            <>
              {!hasRealPaymentMethods && (
                <View className="bg-blue-50 p-4 rounded-lg mb-4">
                  <Text className="text-blue-800 font-semibold mb-2">ℹ️ Automatiska testkort</Text>
                  <Text className="text-blue-700 text-sm">
                    Dina nuvarande betalningsmetoder har skapats automatiskt för utveckling. 
                    Lägg till riktiga testkort för att simulera verkliga användningsfall.
                  </Text>
                </View>
              )}

              {paymentMethods.length === 0 ? (
                <View className="bg-gray-50 p-6 rounded-lg text-center mb-6">
                  <Text className="text-gray-600 text-lg mb-2">Inga sparade betalningsmetoder</Text>
                  <Text className="text-gray-500 text-sm mb-4">
                    Lägg till en betalningsmetod för att hantera dina prenumerationer
                  </Text>
                </View>
              ) : (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Sparade kort ({paymentMethods.length})
                  </Text>
                  
                  {paymentMethods.map((pm) => (
                    <View key={pm.id} className="border border-gray-200 rounded-lg p-4 mb-3 bg-white">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-2xl mr-3">
                              {getCardBrandEmoji(pm.card?.brand || 'card')}
                            </Text>
                            <View>
                              <View className="flex-row items-center">
                                <Text className="font-semibold text-gray-900 capitalize">
                                  {pm.card?.brand} •••• {pm.card?.last4}
                                </Text>
                                {pm.isAutoGenerated && (
                                  <View className="bg-yellow-100 px-2 py-1 rounded ml-2">
                                    <Text className="text-yellow-800 text-xs">Auto</Text>
                                  </View>
                                )}
                                {pm.isUserAdded && (
                                  <View className="bg-green-100 px-2 py-1 rounded ml-2">
                                    <Text className="text-green-800 text-xs">Användare</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-gray-500 text-sm">
                                Utgår {pm.card?.exp_month}/{pm.card?.exp_year}
                              </Text>
                            </View>
                          </View>
                          
                          {pm.isDefault && (
                            <View className="bg-green-100 px-2 py-1 rounded self-start">
                              <Text className="text-green-800 text-xs font-medium">Standard</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row">
                          {!pm.isDefault && (
                            <TouchableOpacity
                              onPress={() => handleSetAsDefault(pm.id)}
                              disabled={isProcessing}
                              className="bg-indigo-100 px-3 py-2 rounded mr-2"
                            >
                              <Text className="text-indigo-700 text-sm font-medium">
                                Sätt som standard
                              </Text>
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity
                            onPress={() => handleDeletePaymentMethod(pm.id)}
                            disabled={isProcessing}
                            className="bg-red-100 px-3 py-2 rounded"
                          >
                            <Text className="text-red-700 text-sm font-medium">Ta bort</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowPaymentSheet(true)}
                disabled={isProcessing}
                className="bg-indigo-600 rounded-lg p-4 mb-4"
              >
                <Text className="text-white font-semibold text-center text-base">
                  + Lägg till betalningsmetod
                </Text>
              </TouchableOpacity>

              <View className="bg-blue-50 p-4 rounded-lg">
                <Text className="text-blue-800 font-semibold mb-2">🔒 Säker betalning</Text>
                <Text className="text-blue-700 text-sm">
                  Alla betalningsuppgifter hanteras säkert av Stripe. Vi sparar aldrig dina kortuppgifter på våra servrar.
                </Text>
              </View>

              {process.env.NODE_ENV === 'development' && (
                <View className="bg-yellow-50 p-4 rounded-lg mt-4">
                  <Text className="text-yellow-800 font-semibold mb-2">🧪 Utvecklingsläge</Text>
                  <Text className="text-yellow-700 text-sm">
                    Du befinner dig i testläge. Inga riktiga betalningar kommer att genomföras.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
