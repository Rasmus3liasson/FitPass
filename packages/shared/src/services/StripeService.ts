import { Platform } from 'react-native';

let StripeService: any;
let initializeStripe: () => Promise<void> = async () => {};

if (Platform.OS !== 'web') {
  // Native: StripeService implementation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initStripe } = require('@stripe/stripe-react-native');
  initializeStripe = async () => {
    try {
      await initStripe({
        publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        merchantIdentifier: 'merchant.com.fitpass',
      });
    } catch (error) {
      console.error('Error initializing Stripe:', error);
    }
  };

  StripeService = class StripeService {
    private static instance: StripeService;
    public static getInstance(): StripeService {
      if (!StripeService.instance) {
        StripeService.instance = new StripeService();
      }
      return StripeService.instance;
    }

    async createCustomer(email: string, name: string, userId?: string): Promise<string> {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/create-customer`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, name, userId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create customer');
        }
        const data = await response.json();
        return data.customerId;
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
      }
    }

    async createSubscription(
      customerId: string,
      priceId: string,
      userId?: string,
      membershipPlanId?: string
    ): Promise<any> {
      try {
        if (userId) {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/manage-subscription`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId, stripePriceId: priceId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to manage subscription');
          }
          const subscription = await response.json();
          return subscription;
        }
        // Fallback to legacy endpoint
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/create-subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId,
              priceId,
              userId,
              membershipPlanId,
              expand: ['latest_invoice.payment_intent'],
            }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create subscription');
        }
        const subscription = await response.json();
        return subscription;
      } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
      }
    }

    async cancelSubscription(
      subscriptionId: string,
      cancelAtPeriodEnd: boolean = true
    ): Promise<any> {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/cancel-subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscriptionId, cancelAtPeriodEnd }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel subscription');
        }
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
      }
    }

    async updateSubscription(subscriptionId: string, newPriceId: string): Promise<any> {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/stripe/update-subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscriptionId, newPriceId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update subscription');
        }
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
      }
    }

    async confirmPayment(clientSecret: string, stripe: any): Promise<any> {
      try {
        const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
          paymentMethodType: 'Card',
        });
        if (error) {
          throw error;
        }
        return paymentIntent;
      } catch (error: any) {
        console.error('Error confirming payment:', error);
        throw error;
      }
    }
  };
} else {
  // Web: stub
  StripeService = class StripeService {
    static getInstance() {
      throw new Error('StripeService is not available on web.');
    }
  };
}

export { StripeService, initializeStripe };
