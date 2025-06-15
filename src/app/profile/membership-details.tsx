import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { BackButton } from '@/src/components/Button';
import { SubscriptionCard } from '@/src/components/SubscriptionCard';
import { PricingCard } from '@/src/components/PricingCard';
import { useStripeSubscription } from '@/src/hooks/useStripeSubscription';
import { useStripePrices } from '@/src/hooks/useStripePrices';
import { useAuth } from '@/src/hooks/useAuth';
import { CreditCard, AlertTriangle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function MembershipDetails() {
  const { user } = useAuth();
  const {
    subscription,
    loading: subscriptionLoading,
    createCustomer,
    createSubscription,
    cancelSubscription,
    formatPrice,
    formatDate,
  } = useStripeSubscription();

  const {
    prices,
    loading: pricesLoading,
    getIntervalText,
  } = useStripePrices();

  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to select a plan',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // First ensure customer exists
      await createCustomer(user.email || '', user.user_metadata?.full_name);
      
      // Create subscription
      const result = await createSubscription(priceId);
      
      if (result.clientSecret) {
        // In a real app, you would redirect to Stripe Checkout or use Stripe Elements
        // For now, we'll show a success message
        Toast.show({
          type: 'success',
          text1: 'Subscription Created',
          text2: 'Your subscription has been set up successfully',
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      Toast.show({
        type: 'error',
        text1: 'Subscription Failed',
        text2: error instanceof Error ? error.message : 'Failed to create subscription',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription(false); // Cancel at period end
              Toast.show({
                type: 'success',
                text1: 'Subscription Canceled',
                text2: 'Your subscription will end at the current period',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Cancellation Failed',
                text2: error instanceof Error ? error.message : 'Failed to cancel subscription',
              });
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'Choose an action for your subscription:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: handleCancelSubscription,
        },
        {
          text: 'Update Payment Method',
          onPress: () => {
            // In a real app, redirect to Stripe Customer Portal
            Toast.show({
              type: 'info',
              text1: 'Feature Coming Soon',
              text2: 'Payment method updates will be available soon',
            });
          },
        },
      ]
    );
  };

  if (subscriptionLoading || pricesLoading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.title}>Membership Details</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerContent}>
            <Text style={styles.title}>Membership Details</Text>
            <Text style={styles.subtitle}>
              Manage your subscription and billing
            </Text>
          </View>
        </View>

        {/* Current Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Subscription</Text>
          <SubscriptionCard
            subscription={subscription}
            onManage={handleManageSubscription}
            onUpgrade={() => {
              // Scroll to pricing section
            }}
            formatPrice={formatPrice}
            formatDate={formatDate}
          />
        </View>

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <Text style={styles.sectionDescription}>
            Choose a plan that fits your fitness goals
          </Text>

          {prices.map((price) => (
            <PricingCard
              key={price.id}
              price={price}
              onSelect={handleSelectPlan}
              isSelected={selectedPriceId === price.id}
              isLoading={isProcessing && selectedPriceId === price.id}
              formatPrice={formatPrice}
              getIntervalText={getIntervalText}
            />
          ))}
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          
          <View style={styles.billingCard}>
            <View style={styles.billingHeader}>
              <CreditCard size={24} color="#6366F1" />
              <Text style={styles.billingTitle}>Payment Method</Text>
            </View>
            
            <Text style={styles.billingText}>
              {subscription 
                ? 'Your payment method is managed through Stripe'
                : 'No payment method on file'
              }
            </Text>
            
            <TouchableOpacity
              style={styles.billingButton}
              onPress={() => {
                Toast.show({
                  type: 'info',
                  text1: 'Feature Coming Soon',
                  text2: 'Payment method management will be available soon',
                });
              }}
            >
              <Text style={styles.billingButtonText}>
                {subscription ? 'Update Payment Method' : 'Add Payment Method'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.notesTitle}>Important Notes</Text>
            </View>
            
            <Text style={styles.notesText}>
              • Subscriptions are billed automatically{'\n'}
              • You can cancel anytime before your next billing date{'\n'}
              • Refunds are processed according to our refund policy{'\n'}
              • Contact support for billing questions
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 16,
  },
  billingCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  billingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  billingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  billingText: {
    fontSize: 16,
    color: '#A0A0A0',
    marginBottom: 16,
    lineHeight: 24,
  },
  billingButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  billingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notesCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  },
});