import { useStripe } from '@stripe/stripe-react-native';
import { useState } from 'react';
import colors from '../constants/custom-colors';
import { useAuth } from './useAuth';
import { useGlobalFeedback } from './useGlobalFeedback';

interface UseStripePaymentSheetOptions {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export const useStripePaymentSheet = (options?: UseStripePaymentSheetOptions) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useGlobalFeedback();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const addPaymentMethod = async () => {
    if (isLoading || !user?.id || !user?.email) return;

    try {
      setIsLoading(true);

      // Create Setup Intent
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/stripe/get-customer`, {
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
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || response.statusText;
        console.error('API Error:', response.status, errorMessage, errorData);
        throw new Error(`Kunde inte skapa betalningssession: ${errorMessage}`);
      }

      const { setupIntent, ephemeralKey, customer } = await response.json();

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FitPass',
        customerId: customer.id,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          address: {
            country: 'SE',
          },
        },
        appearance: {
          colors: {
            primary: colors.primary,
            background: colors.surface,
            componentBackground: colors.surface,
            componentBorder: colors.borderGray,
            componentDivider: colors.borderGray,
            primaryText: colors.textPrimary,
            secondaryText: colors.textSecondary,
            componentText: colors.textPrimary,
            placeholderText: colors.textSecondary,
            icon: colors.textSecondary,
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
        returnURL: 'fitpass://stripe-redirect',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          const error = new Error(presentError.message);
          showError('Fel', presentError.message);
          options?.onError?.(error);
        }
      } else {
        showSuccess('Framgång', 'Betalningsmetod tillagd!');
        await options?.onSuccess?.();
      }
    } catch (error) {
      console.error('Add card error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte lägga till kort';
      showError('Fel', errorMessage);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addPaymentMethod,
    isLoading,
  };
};
