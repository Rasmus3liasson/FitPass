import { useAuth } from '@/src/hooks/useAuth';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

interface StripePaymentSheetProps {
  onPaymentMethodAdded: (paymentMethodId: string) => void;
  onClose: () => void;
}

// Payment Sheet Component
function PaymentSheetContent({ onPaymentMethodAdded, onClose }: StripePaymentSheetProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const setupPaymentSheet = async () => {
    try {
      setLoading(true);

      if (!user?.id || !user?.email) {
        Alert.alert('Fel', 'Användaruppgifter saknas');
        return;
      }

      // Call your backend to create a Setup Intent for saving payment methods
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/stripe/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create setup intent');
      }

      const { setupIntent, ephemeralKey, customer } = await response.json();

      // Initialize the Payment Sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'FitPass',
        customerId: customer.id,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        appearance: {
          colors: {
            primary: '#6366f1', // Your brand color
            background: '#ffffff',
            componentBackground: '#f8fafc',
            componentBorder: '#e2e8f0',
            primaryText: '#1e293b',
            secondaryText: '#64748b',
            componentText: '#374151',
            placeholderText: '#9ca3af',
          },
          shapes: {
            borderRadius: 8,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: '#6366f1',
              text: '#ffffff',
            },
          },
        },
        returnURL: 'fitpass://stripe-redirect',
      });

      if (error) {
        console.error('Payment sheet initialization failed:', error);
        Alert.alert('Fel', 'Kunde inte initiera betalning');
        return;
      }

      // Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          console.error('Payment sheet error:', paymentError);
          Alert.alert('Fel', paymentError.message);
        }
        return;
      }

      // Success! Payment method was saved
      Alert.alert(
        'Betalningsmetod sparad!',
        'Din betalningsmetod har lagts till framgångsrikt.',
        [
          {
            text: 'OK',
            onPress: () => {
              onPaymentMethodAdded('payment_method_added');
              onClose();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Setup payment sheet error:', error);
      Alert.alert('Fel', 'Kunde inte ladda betalningsalternativ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Lägg till betalningsmetod</Text>
        <Text className="text-gray-600 text-center mb-6">
          Använd Stripes säkra betalningsformulär för att lägga till ditt kort
        </Text>
      </View>

      <View className="bg-blue-50 p-4 rounded-lg mb-6 w-full">
        <Text className="text-blue-800 font-semibold mb-2">🔒 Säker betalning</Text>
        <Text className="text-blue-700 text-sm">
          Dina kortuppgifter hanteras säkert av Stripe och sparas inte på våra servrar.
        </Text>
      </View>

      <TouchableOpacity
        onPress={setupPaymentSheet}
        disabled={loading}
        className="bg-indigo-600 px-8 py-4 rounded-lg mb-4 w-full"
      >
        {loading ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="white" />
            <Text className="text-white font-semibold ml-2">Laddar...</Text>
          </View>
        ) : (
          <Text className="text-white font-semibold text-center text-lg">
            Lägg till betalningsmetod
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        className="px-4 py-2"
      >
        <Text className="text-gray-600">Avbryt</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main component with Stripe Provider
export default function StripePaymentSheet({ onPaymentMethodAdded, onClose }: StripePaymentSheetProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-red-600 text-center">
          Stripe configuration missing. Please check your environment variables.
        </Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <PaymentSheetContent 
        onPaymentMethodAdded={onPaymentMethodAdded}
        onClose={onClose}
      />
    </StripeProvider>
  );
}
