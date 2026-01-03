import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { BillingHistory, BillingService, Subscription } from '../services/BillingService';

interface BillingModalProps {
  userId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function BillingModal({ userId, isVisible, onClose }: BillingModalProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [processing, setProcessing] = useState(false);
  const { showSuccess, showError } = useGlobalFeedback();
  
  // Use React Query hook for payment methods
  const { data: paymentMethodsResult } = usePaymentMethods(userId);
  const paymentMethods = paymentMethodsResult?.paymentMethods || [];

  useEffect(() => {
    if (isVisible && userId) {
      loadBillingData();
    }
  }, [isVisible, userId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load subscription and billing history (payment methods handled by React Query)
      const [subscriptionResult, historyResult] = await Promise.all([
        BillingService.getUserSubscription(userId),
        BillingService.getBillingHistory(userId),
      ]);

      if (subscriptionResult.success) {
        setSubscription(subscriptionResult.subscription || null);
      }

      if (historyResult.success) {
        setBillingHistory(historyResult.history || []);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      showError('Fel', 'Kunde inte ladda faktureringsuppgifter');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    // Note: Consider implementing CustomAlert component for confirmation dialogs
    // For now, directly call cancel - consider adding a confirmation modal
    confirmCancelSubscription();
  };

  const confirmCancelSubscription = async () => {
    try {
      setProcessing(true);
      const result = await BillingService.cancelSubscription(userId, 'user_requested');
      
      if (result.success) {
        showSuccess('Prenumeration avslutad', result.message);
        loadBillingData();
      } else {
        showError('Fel', result.error || 'Kunde inte avsluta prenumeration');
      }
    } catch (error) {
      showError('Fel', 'Ett fel uppstod vid avslutning av prenumeration');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setProcessing(true);
      const result = await BillingService.reactivateSubscription(userId);
      
      if (result.success) {
        showSuccess('Prenumeration återaktiverad', result.message);
        loadBillingData();
      } else {
        showError('Fel', result.error || 'Kunde inte återaktivera prenumeration');
      }
    } catch (error) {
      showError('Fel', 'Ett fel uppstod vid återaktivering av prenumeration');
    } finally {
      setProcessing(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trialing': return 'text-blue-600 bg-blue-100';
      case 'canceled': return 'text-red-600 bg-red-100';
      case 'past_due': return 'text-orange-600 bg-orange-100';
      default: return 'text-textSecondary bg-accentGray';
    }
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

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center p-6 pt-16 bg-surface">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Text className="text-primary text-lg">💳</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">Fakturering & Prenumeration</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            className="w-10 h-10 rounded-full bg-accentGray items-center justify-center"
          >
            <Text className="text-textPrimary text-lg">✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center bg-background">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-textSecondary">Laddar faktureringsuppgifter...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 bg-background">
            <View className="p-6">
              {/* Subscription Overview */}
              <View className="bg-surface rounded-2xl p-6 mb-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">📊</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">Prenumerationsöversikt</Text>
                </View>
                
                {subscription ? (
                  <View className="space-y-4">
                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Plan</Text>
                      <Text className="text-textPrimary font-semibold">{subscription.plan_name}</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Status</Text>
                      <View className={`px-3 py-1 rounded-full ${
                        subscription.status === 'active' ? 'bg-accentGreen/20' :
                        subscription.status === 'trialing' ? 'bg-accentBlue/20' :
                        subscription.status === 'canceled' ? 'bg-accentRed/20' :
                        subscription.status === 'past_due' ? 'bg-accentYellow/20' : 'bg-accentGray/20'
                      }`}>
                        <Text className={`text-sm font-medium ${
                          subscription.status === 'active' ? 'text-accentGreen' :
                          subscription.status === 'trialing' ? 'text-accentBlue' :
                          subscription.status === 'canceled' ? 'text-accentRed' :
                          subscription.status === 'past_due' ? 'text-accentYellow' : 'text-textSecondary'
                        }`}>
                          {getStatusText(subscription.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Pris</Text>
                      <Text className="text-textPrimary font-semibold">
                        {formatAmount(subscription.amount, subscription.currency)}/{subscription.interval === 'month' ? 'månad' : subscription.interval}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                      <Text className="text-textSecondary">Nuvarande period</Text>
                      <Text className="text-textPrimary text-right font-medium">
                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                      </Text>
                    </View>
                    
                    {subscription.next_billing_date && (
                      <View className="flex-row justify-between items-center py-3 border-b border-accentGray/20">
                        <Text className="text-textSecondary">Nästa faktura</Text>
                        <Text className="text-textPrimary font-medium">{formatDate(subscription.next_billing_date)}</Text>
                      </View>
                    )}
                    
                    {subscription.days_until_renewal && (
                      <View className="flex-row justify-between items-center py-3">
                        <Text className="text-textSecondary">Förnyelse om</Text>
                        <View className="bg-primary/20 px-3 py-1 rounded-full">
                          <Text className="text-primary font-semibold">{subscription.days_until_renewal} dagar</Text>
                        </View>
                      </View>
                    )}
                    
                    {subscription.cancel_at_period_end && (
                      <View className="bg-accentYellow/10 p-4 rounded-xl mt-4 border border-accentYellow/20">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-accentYellow text-lg mr-2">⚠️</Text>
                          <Text className="text-accentYellow font-bold">Prenumerationen avslutas</Text>
                        </View>
                        <Text className="text-textSecondary text-sm">
                          Din prenumeration kommer att avslutas {formatDate(subscription.current_period_end)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-4">💤</Text>
                    <Text className="text-textSecondary text-lg">Ingen aktiv prenumeration</Text>
                    <Text className="text-textSecondary text-sm mt-2">Starta din FitPass-resa idag!</Text>
                  </View>
                )}
              </View>

              {/* Subscription Actions */}
              {subscription && (
                <View className="mb-6">
                  {subscription.cancel_at_period_end ? (
                    <TouchableOpacity
                      onPress={handleReactivateSubscription}
                      disabled={processing}
                      className="bg-accentGreen rounded-2xl p-4 shadow-lg"
                      style={{
                        shadowColor: "#4CAF50",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <View className="flex-row items-center justify-center">
                        <Text className="text-textPrimary text-lg mr-2">🔄</Text>
                        <Text className="text-textPrimary font-bold text-lg">
                          {processing ? 'Återaktiverar...' : 'Återaktivera prenumeration'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : subscription.status === 'active' ? (
                    <TouchableOpacity
                      onPress={handleCancelSubscription}
                      disabled={processing}
                      className="bg-accentRed rounded-2xl p-4 shadow-lg"
                      style={{
                        shadowColor: "#F44336",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      <View className="flex-row items-center justify-center">
                        <Text className="text-textPrimary text-lg mr-2">⏸️</Text>
                        <Text className="text-textPrimary font-bold text-lg">
                          {processing ? 'Bearbetar...' : 'Avsluta prenumeration'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {/* Payment Method */}
              <View className="bg-surface rounded-2xl p-6 mb-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">💳</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">Betalningsmetod</Text>
                </View>
                
                {paymentMethods.length > 0 ? (
                  <View>
                    {paymentMethods.filter(pm => pm.isDefault).map(pm => (
                      <View key={pm.id} className="bg-accentGray/30 rounded-xl p-4 border border-accentGray/20">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-12 h-8 bg-primary/20 rounded-lg items-center justify-center mr-3">
                              <Text className="text-primary font-bold text-sm">
                                {pm.card?.brand?.slice(0, 4).toUpperCase()}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-textPrimary font-semibold capitalize">
                                {pm.card?.brand} •••• {pm.card?.last4}
                              </Text>
                              <Text className="text-textSecondary text-sm">
                                Utgår {pm.card?.exp_month?.toString().padStart(2, '0')}/{pm.card?.exp_year}
                              </Text>
                            </View>
                          </View>
                          <View className="bg-accentGreen/20 px-3 py-1 rounded-full">
                            <Text className="text-accentGreen text-xs font-bold">STANDARD</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                    
                    {paymentMethods.filter(pm => pm.isDefault).length === 0 && (
                      <View className="bg-accentYellow/10 p-4 rounded-xl border border-accentYellow/20">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-accentYellow text-lg mr-2">⚠️</Text>
                          <Text className="text-accentYellow font-bold">Ingen standardbetalningsmetod</Text>
                        </View>
                        <Text className="text-textSecondary text-sm">
                          Sätt en betalningsmetod som standard för automatiska betalningar
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="items-center py-6">
                    <Text className="text-4xl mb-3">💳</Text>
                    <Text className="text-textSecondary">Inga betalningsmetoder hittades</Text>
                  </View>
                )}
              </View>

              {/* Billing History */}
              <View className="bg-surface rounded-2xl p-6 border border-accentGray/30">
                <View className="flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Text className="text-primary">📋</Text>
                  </View>
                  <Text className="text-lg font-bold text-textPrimary">Fakturahistorik</Text>
                </View>
                
                {billingHistory.length > 0 ? (
                  <View className="space-y-3">
                    {billingHistory.slice(0, 10).map((invoice, index) => (
                      <View key={invoice.id} className={`flex-row justify-between items-center py-4 ${index < billingHistory.slice(0, 10).length - 1 ? 'border-b border-accentGray/20' : ''}`}>
                        <View className="flex-1">
                          <Text className="text-textPrimary font-semibold mb-1">{invoice.description}</Text>
                          <Text className="text-textSecondary text-sm">{formatDate(invoice.date)}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-textPrimary font-bold text-lg mb-1">
                            {formatAmount(invoice.amount, invoice.currency)}
                          </Text>
                          <View className={`px-3 py-1 rounded-full ${
                            invoice.status === 'paid' ? 'bg-accentGreen/20' : 
                            invoice.status === 'pending' ? 'bg-accentYellow/20' : 'bg-accentRed/20'
                          }`}>
                            <Text className={`text-xs font-bold ${
                              invoice.status === 'paid' ? 'text-accentGreen' : 
                              invoice.status === 'pending' ? 'text-accentYellow' : 'text-accentRed'
                            }`}>
                              {invoice.status === 'paid' ? 'BETALD' : 
                               invoice.status === 'pending' ? 'VÄNTANDE' : 'MISSLYCKAD'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-8">
                    <Text className="text-4xl mb-3">📄</Text>
                    <Text className="text-textSecondary">Ingen fakturahistorik tillgänglig</Text>
                  </View>
                )}
              </View>

              {/* Info Section */}
              <View className="bg-primary/10 p-6 rounded-2xl mt-6 border border-primary/20">
                <View className="flex-row items-center mb-3">
                  <Text className="text-primary text-lg mr-2">ℹ️</Text>
                  <Text className="text-primary font-bold text-lg">Om prenumerationshantering</Text>
                </View>
                <View className="space-y-2">
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Prenumerationer avslutas alltid vid slutet av din nuvarande faktureringsperiod
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Du behåller full åtkomst tills prenumerationen faktiskt löper ut
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="text-textSecondary text-sm flex-1">
                      Du kan återaktivera din prenumeration när som helst innan den löper ut
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
