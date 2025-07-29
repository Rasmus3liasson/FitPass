import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
// import { useStripe } from '@stripe/stripe-react-native';
import { MembershipPlan } from '@/types';
import Toast from 'react-native-toast-message';
import { useCreateSubscription } from '../hooks/useSubscription';
import { Button } from './Button';

interface SubscriptionPaymentProps {
  plan: MembershipPlan;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SubscriptionPayment: React.FC<SubscriptionPaymentProps> = ({
  plan,
  onSuccess,
  onCancel,
}) => {
  // const stripe = useStripe();
  const createSubscription = useCreateSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    // Temporarily commented out until Stripe is properly configured
    // if (!stripe) {
    //   Alert.alert('Error', 'Payment system not initialized');
    //   return;
    // }

    setIsProcessing(true);

    try {
      // Create subscription
      const result = await createSubscription.mutateAsync(plan);
      
      // Temporarily skip client secret confirmation
      // if (result.clientSecret) {
      //   const { error } = await stripe.confirmPayment(result.clientSecret, {
      //     paymentMethodType: 'Card',
      //   });

      //   if (error) {
      //     throw new Error(error.message);
      //   }
      // }

      Toast.show({
        type: 'success',
        text1: 'Subscription Active!',
        text2: `Welcome to ${plan.title}! Your subscription is now active.`,
        position: 'top',
        visibilityTime: 4000,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Subscription Failed',
        text2: error?.message || 'Unable to process subscription. Please try again.',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="p-6 bg-surface rounded-2xl">
      <Text className="text-white text-xl font-bold mb-2">{plan.title}</Text>
      <Text className="text-textSecondary text-base mb-4">{plan.description}</Text>
      
      <View className="mb-4">
        <Text className="text-white text-2xl font-bold">${plan.price}</Text>
        <Text className="text-textSecondary">per month</Text>
      </View>

      <View className="mb-6">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View className="w-2 h-2 bg-primary rounded-full mr-3" />
            <Text className="text-textSecondary">{feature}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row space-x-3">
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 py-3 px-4 rounded-lg border border-border"
            disabled={isProcessing}
          >
            <Text className="text-textSecondary text-center font-medium">Cancel</Text>
          </TouchableOpacity>
        )}
        
        <Button
          title={isProcessing || createSubscription.isPending ? "Processing..." : plan.button_text}
          onPress={handleSubscribe}
          disabled={isProcessing || createSubscription.isPending}
          loading={isProcessing || createSubscription.isPending}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};
