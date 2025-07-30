import { useAuth } from '@/src/hooks/useAuth';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

interface StripePaymentSheetProps {
  onPaymentMethodAdded: () => void;
  onClose: () => void;
  customerId?: string | null;
  darkMode?: boolean;
}

// Payment Sheet Component
function PaymentSheetContent({ onPaymentMethodAdded, onClose, customerId, darkMode = true }: StripePaymentSheetProps) {
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
        // Enable multiple payment methods support
        allowsRemovalOfLastSavedPaymentMethod: false,
        defaultBillingDetails: {
          address: {
            country: 'SE', // Sverige som standard
          },
        },
        appearance: darkMode ? {
          colors: {
            primary: '#6366f1',
            background: '#1f2937',
            componentBackground: '#374151',
            componentBorder: '#4b5563',
            componentDivider: '#6b7280',
            primaryText: '#ffffff',
            secondaryText: '#d1d5db',
            componentText: '#ffffff',
            placeholderText: '#9ca3af',
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
          primaryButton: {
            colors: {
              background: '#6366f1',
              text: '#ffffff',
            },
          },
        } : undefined,
        returnURL: 'fitpass://stripe-redirect',
      });

      if (error) {
        Alert.alert('Fel', 'Kunde inte initiera betalning');
        return;
      }

      // Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          // Check for specific error types to give better feedback
          let errorMessage = paymentError.message;
          
          if (paymentError.message?.includes('duplicate') || 
              paymentError.message?.includes('already exists')) {
            errorMessage = 'Detta kort har redan lagts till. Försök med ett annat kort.';
          } else if (paymentError.message?.includes('card_declined')) {
            errorMessage = 'Kortet avvisades. Kontrollera dina kortuppgifter.';
          }
          
          Alert.alert('Fel', errorMessage);
        }
        return;
      }

      // Success! Payment method was saved
      console.log('✅ Payment method successfully added via Payment Sheet');
      
      // Give Stripe a moment to process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to sync payment methods to ensure we get the latest data
      try {
        console.log('🔄 Syncing payment methods after successful addition...');
        const syncResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/stripe/user/${user.id}/sync-payment-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
          }),
        });
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('✅ Sync successful: Found', syncResult.paymentMethods?.length || 0, 'payment methods');
          console.log('🔍 Sync details:', {
            hasRealPaymentMethods: syncResult.hasRealPaymentMethods,
            customerId: syncResult.customerId,
            syncTimestamp: syncResult.syncTimestamp
          });
        } else {
          console.error('⚠️ Sync failed with status:', syncResponse.status);
        }
      } catch (syncError) {
        console.error('⚠️ Could not sync payment methods:', syncError);
      }

      Alert.alert(
        'Betalningsmetod sparad!',
        'Din betalningsmetod har lagts till framgångsrikt.',
        [
          {
            text: 'OK',
            onPress: () => {
              onPaymentMethodAdded();
              onClose();
            },
          },
        ]
      );

    } catch (error: any) {
      Alert.alert('Fel', 'Kunde inte ladda betalningsalternativ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 justify-center items-center p-6 ${darkMode ? 'bg-background' : 'bg-white'}`}>
      <View className="items-center mb-8">
        <Text className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Lägg till betalningsmetod
        </Text>
        <Text className={`text-center mb-6 ${darkMode ? 'text-textSecondary' : 'text-gray-600'}`}>
          Använd Stripes säkra betalningsformulär för att lägga till ditt kort
        </Text>
      </View>

      {__DEV__ && (
        <View className={`border p-4 rounded-lg mb-6 w-full ${
          darkMode 
            ? 'bg-surface border-border' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <Text className={`font-semibold mb-2 ${
            darkMode ? 'text-white' : 'text-amber-800'
          }`}>
            🧪 Utvecklingsläge - Testkort
          </Text>
          <Text className={`text-sm mb-2 ${
            darkMode ? 'text-textSecondary' : 'text-amber-700'
          }`}>
            Använd dessa testkort (använd inte riktiga kortuppgifter):
          </Text>
          <View className="space-y-1">
            <Text className={`text-xs font-mono ${
              darkMode ? 'text-textSecondary' : 'text-amber-700'
            }`}>
              Visa: 4242 4242 4242 4242
            </Text>
            <Text className={`text-xs font-mono ${
              darkMode ? 'text-textSecondary' : 'text-amber-700'
            }`}>
              Mastercard: 5555 5555 5555 4444
            </Text>
            <Text className={`text-xs font-mono ${
              darkMode ? 'text-textSecondary' : 'text-amber-700'
            }`}>
              CVC: 123, Datum: 12/34
            </Text>
          </View>
        </View>
      )}

      <View className={`p-4 rounded-lg mb-6 w-full ${
        darkMode 
          ? 'bg-surface border border-border' 
          : 'bg-green-50'
      }`}>
        <Text className={`font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-green-800'
        }`}>
          💳 Betalningsalternativ
        </Text>
        <Text className={`text-sm mb-2 ${
          darkMode ? 'text-textSecondary' : 'text-green-700'
        }`}>
          Stripe Payment Sheet inkluderar automatiskt:
        </Text>
        <View className="ml-2">
          <Text className={`text-sm ${
            darkMode ? 'text-textSecondary' : 'text-green-700'
          }`}>
            • Kort (Visa, Mastercard, Amex)
          </Text>
          <Text className={`text-sm ${
            darkMode ? 'text-textSecondary' : 'text-green-700'
          }`}>
            • Apple Pay (iOS)
          </Text>
          <Text className={`text-sm ${
            darkMode ? 'text-textSecondary' : 'text-green-700'
          }`}>
            • Klarna (Sverige)
          </Text>
          <Text className={`text-sm ${
            darkMode ? 'text-textSecondary' : 'text-green-700'
          }`}>
            • Andra lokala betalningsmetoder
          </Text>
        </View>
      </View>

      <View className={`p-4 rounded-lg mb-6 w-full ${
        darkMode 
          ? 'bg-surface border border-border' 
          : 'bg-blue-50'
      }`}>
        <Text className={`font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-blue-800'
        }`}>
          🔒 Säker betalning
        </Text>
        <Text className={`text-sm ${
          darkMode ? 'text-textSecondary' : 'text-blue-700'
        }`}>
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
        <Text className={darkMode ? 'text-textSecondary' : 'text-gray-600'}>
          Avbryt
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Main component with Stripe Provider
export default function StripePaymentSheet({ 
  onPaymentMethodAdded, 
  onClose, 
  customerId, 
  darkMode = true 
}: StripePaymentSheetProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <View className={`flex-1 justify-center items-center p-6 ${darkMode ? 'bg-background' : 'bg-white'}`}>
        <Text className={`text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
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
        customerId={customerId}
        darkMode={darkMode}
      />
    </StripeProvider>
  );
}