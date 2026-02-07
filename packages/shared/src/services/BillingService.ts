export interface BillingResult {
  success: boolean;
  message: string;
  error?: string;
}

// Billing/display format of subscription info (from Stripe + DB)
export interface SubscriptionInfo {
  id: string;
  status:
    | 'active'
    | 'canceled'
    | 'past_due'
    | 'trialing'
    | 'incomplete'
    | 'incomplete_expired'
    | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  plan_name: string;
  amount: number;
  currency: string;
  interval: string;
  next_billing_date?: string;
  days_until_renewal?: number;
}

export interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
  invoice_url?: string;
}

export class BillingService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL;

  // Get user's active subscription
  static async getUserSubscription(userId: string): Promise<{
    success: boolean;
    subscription?: SubscriptionInfo;
    error?: string;
  }> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      // Use the user-based subscription endpoint
      const response = await fetch(`${this.baseUrl}/api/stripe/user/${userId}/subscription`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // User may not have a subscription yet
        return {
          success: true,
          subscription: undefined,
        };
      }

      const data = await response.json();

      // Transform the data to match our Subscription interface
      if (data.subscription && data.membership) {
        const stripeSubscription = data.subscription;
        const membership = data.membership;

        // Calculate days until renewal
        const now = new Date();
        const periodEnd = new Date(stripeSubscription.current_period_end);
        const daysUntilRenewal = Math.ceil(
          (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const transformedSubscription: SubscriptionInfo = {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_start: stripeSubscription.current_period_start,
          current_period_end: stripeSubscription.current_period_end,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
          canceled_at: stripeSubscription.canceled_at,
          plan_name: membership.plan_type || 'Unknown Plan',
          amount: stripeSubscription.plan?.amount || 0,
          currency: stripeSubscription.currency || 'sek',
          interval: stripeSubscription.plan?.interval || 'month',
          next_billing_date: stripeSubscription.current_period_end,
          days_until_renewal: daysUntilRenewal,
        };

        return {
          success: true,
          subscription: transformedSubscription,
        };
      }

      return {
        success: true,
        subscription: undefined,
      };
    } catch (error) {
      console.error('Get Subscription Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get subscription',
      };
    }
  }

  // Cancel subscription at period end
  static async cancelSubscription(userId: string, reason?: string): Promise<BillingResult> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(`${this.baseUrl}/api/user/${userId}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true, // Standard behavior - cancel at period end
          reason: reason || 'user_requested',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message:
          data.message || 'Subscription will be canceled at the end of your current billing period',
      };
    } catch (error) {
      console.error('Cancel Subscription Error:', error);
      return {
        success: false,
        message: 'Failed to cancel subscription',
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  // Reactivate canceled subscription
  static async reactivateSubscription(userId: string): Promise<BillingResult> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(
        `${this.baseUrl}/api/stripe/user/${userId}/subscription/reactivate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message || 'Subscription reactivated successfully',
      };
    } catch (error) {
      console.error('Reactivate Subscription Error:', error);
      return {
        success: false,
        message: 'Failed to reactivate subscription',
        error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
      };
    }
  }

  // Update subscription payment method
  static async updateSubscriptionPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<BillingResult> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(
        `${this.baseUrl}/api/stripe/user/${userId}/update-payment-method`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message || 'Payment method updated successfully',
      };
    } catch (error) {
      console.error('Update Payment Method Error:', error);
      return {
        success: false,
        message: 'Failed to update payment method',
        error: error instanceof Error ? error.message : 'Failed to update payment method',
      };
    }
  }

  // Get billing history
  static async getBillingHistory(userId: string): Promise<{
    success: boolean;
    history?: BillingHistory[];
    error?: string;
  }> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(`${this.baseUrl}/api/stripe/user/${userId}/billing-history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Parse error to check if it's a "no customer" error or rate limit
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        // Handle "no customer" case gracefully - user hasn't set up Stripe yet
        if (response.status === 500 && errorData.error?.includes('No such customer')) {
          return {
            success: true,
            history: [],
          };
        }

        // Handle rate limit gracefully - return empty history, don't throw
        if (response.status === 429) {
          console.warn('Rate limit hit for billing history, returning empty data');
          return {
            success: true,
            history: [],
          };
        }

        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        history: data.history || [],
      };
    } catch (error) {
      console.error('Get Billing History Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get billing history',
      };
    }
  }

  // Get upcoming invoice
  static async getUpcomingInvoice(userId: string): Promise<{
    success: boolean;
    invoice?: {
      amount: number;
      currency: string;
      date: string;
      description: string;
    };
    error?: string;
  }> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(`${this.baseUrl}/api/stripe/user/${userId}/upcoming-invoice`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        invoice: data.invoice,
      };
    } catch (error) {
      console.error('Get Upcoming Invoice Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upcoming invoice',
      };
    }
  }
}

// Initialize the service
(function initializeBillingService() {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    console.error('❌ BillingService - EXPO_PUBLIC_API_URL is not set!');
  }
})();
