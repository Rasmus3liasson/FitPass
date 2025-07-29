export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    created: number;
    updated: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  };
  error?: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_type: string;
  credits: number;
  credits_used: number;
  has_used_trial: boolean;
  trial_end_date?: string;
  trial_days_remaining?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  plan_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_status?: string;
  created_at: string;
  updated_at: string;
  membership_plan?: {
    id: string;
    title: string;
    price: number;
    description?: string;
    features: string[];
    credits: number;
  };
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class SubscriptionSyncService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL;

  // Synka prenumerationer från Stripe
  static async syncSubscriptionsFromStripe(): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/sync-subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync subscriptions');
      }

      return result;
    } catch (error: any) {
      console.error('Error syncing subscriptions:', error);
      return {
        success: false,
        message: 'Failed to sync subscriptions',
        error: error.message
      };
    }
  }

  // Hämta användarens aktiva medlemskap
  static async getUserMembership(userId: string): Promise<UserMembership | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/user-membership/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No active membership found
        }
        throw new Error(result.error || 'Failed to get user membership');
      }

      return result.data;
    } catch (error: any) {
      console.error('Error getting user membership:', error);
      throw new Error(error.message);
    }
  }

  // Hämta alla membership plans (från din databas, med Stripe-data)
  static async getMembershipPlans(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/membership-plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get membership plans');
      }

      return result;
    } catch (error: any) {
      console.error('Error getting membership plans:', error);
      throw new Error(error.message);
    }
  }

  // Synka produkter från databas till Stripe
  static async syncProductsToStripe(): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync products');
      }

      return {
        success: true,
        message: result.message || 'Products synced successfully'
      };
    } catch (error: any) {
      console.error('Error syncing products:', error);
      return {
        success: false,
        message: 'Failed to sync products',
        error: error.message
      };
    }
  }

  // Synka produkter FRÅN Stripe TILL databas (reverse sync)
  static async syncProductsFromStripe(): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/sync-products-from-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync products from Stripe');
      }

      return {
        success: true,
        message: result.message || 'Products synced from Stripe successfully',
        data: result.data
      };
    } catch (error: any) {
      console.error('Error syncing products from Stripe:', error);
      return {
        success: false,
        message: 'Failed to sync products from Stripe',
        error: error.message
      };
    }
  }

  // Hämta alla Stripe produkter
  static async getStripeProducts(): Promise<{success: boolean; data?: any[]; error?: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/stripe-products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Error getting Stripe products:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

    // Skapa Stripe prenumeration för befintligt medlemskap
  static async createStripeSubscriptionForMembership(userId: string, planId: string): Promise<{success: boolean; data?: any; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-membership-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Stripe subscription created:', result);
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error creating Stripe subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Unified subscription management - handles create, update, and plan changes
  static async manageSubscription(userId: string, stripePriceId: string): Promise<{success: boolean; data?: any; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/manage-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, stripePriceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Subscription managed successfully:', result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error managing subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Legacy method - now uses unified endpoint
  static async createSubscriptionMembership(userId: string, stripePriceId: string): Promise<{success: boolean; data?: any; error?: string}> {
    console.log('🔄 Using legacy createSubscriptionMembership, redirecting to unified endpoint');
    return this.manageSubscription(userId, stripePriceId);
  }

  // Complete subscription payment for testing
  static async completeSubscriptionPayment(subscriptionId: string): Promise<{success: boolean; message?: string; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/complete-payment/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Payment completed:', result);
      return { success: true, message: result.message };
    } catch (error) {
      console.error('❌ Error completing payment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get incomplete subscriptions for testing
  static async getIncompleteSubscriptions(): Promise<{success: boolean; data?: any[]; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/incomplete-subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Error getting incomplete subscriptions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Comprehensive sync of all subscriptions from Stripe
  static async syncAllSubscriptions(): Promise<{success: boolean; data?: any; message?: string; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/sync-all-subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ All subscriptions synced:', result);
      return { 
        success: true, 
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Error syncing all subscriptions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default SubscriptionSyncService;
