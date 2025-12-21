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

    // Hämta användarens membership från databasen
  static async getUserMembership(userId: string): Promise<UserMembership | null> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }



      const response = await fetch(`${this.baseUrl}/api/stripe/user/${userId}/membership`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is HTML (server error page)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${contentType} instead of JSON. Is the backend server running?`);
      }

      const result = await response.json();

      // Handle 404 (no membership found) as a normal case for new users
      if (response.status === 404) {
        console.log('ℹ️ No membership found for user (this is normal for new users)');
        return null;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get user membership');
      }

      return result.membership;
    } catch (error: any) {
      // Don't log errors for normal "no membership" cases
      if (error.message.includes('Route not found') || error.message.includes('404')) {
        console.log('ℹ️ No membership found for user - this is normal for new users');
        return null;
      }
      
      console.error('❌ Error fetching membership:', error);
      
      // Provide more helpful error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please ensure the backend is running.');
      }
      
      if (error.message.includes('JSON Parse error')) {
        throw new Error('Backend server returned an error page instead of JSON. Check server logs.');
      }
      
      throw new Error(error.message);
    }
  }

  // Hämta alla membership plans (från din databas, med Stripe-data)
  static async getMembershipPlans(): Promise<any[]> {
    try {
      if (!this.baseUrl) {
        throw new Error('EXPO_PUBLIC_API_URL environment variable is not set');
      }

      const response = await fetch(`${this.baseUrl}/api/stripe/membership-plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is HTML (server error page)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${contentType} instead of JSON. Is the backend server running?`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get membership plans');
      }

      return result;
    } catch (error: any) {
      console.error('Error getting membership plans:', error);
      
      // Provide more helpful error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please ensure the backend is running.');
      }
      
      if (error.message.includes('JSON Parse error')) {
        throw new Error('Backend server returned an error page instead of JSON. Check server logs.');
      }
      
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

  // Sync existing memberships to Stripe (create missing subscriptions)
  static async syncMembershipsToStripe(): Promise<{success: boolean; synced?: number; failed?: number; total?: number; message?: string; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/sync-memberships-to-stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { 
        success: true, 
        synced: result.synced,
        failed: result.failed,
        total: result.total,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Error syncing memberships to Stripe:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check how many memberships need Stripe sync
  static async checkMembershipSyncStatus(): Promise<{success: boolean; needsSync?: number; alreadySynced?: number; totalActive?: number; error?: string}> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/membership-sync-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return { 
        success: true, 
        needsSync: result.needsSync,
        alreadySynced: result.alreadySynced,
        totalActive: result.totalActive
      };
    } catch (error) {
      console.error('❌ Error checking membership sync status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

    // Auto-sync on startup - combines both sync directions AND product sync
  static async autoSyncOnStartup(): Promise<{success: boolean; message?: string; error?: string; syncResult?: any}> {
    try {
      console.log('🔄 Auto-sync: Starting comprehensive sync');
      
      // First ensure products are synced to Stripe (critical for new setups)
      console.log('� Auto-sync: Syncing products to Stripe...');
      const productsResult = await this.syncProductsToStripe();
      
      if (!productsResult.success) {
        console.warn('⚠️ Auto-sync: Product sync failed, continuing with subscription sync...');
      } else {
        console.log('✅ Auto-sync: Products synced to Stripe successfully');
      }
      
      // Then sync from Stripe to our database (get latest subscription updates)
      const fromStripeResult = await this.syncSubscriptionsFromStripe();
      console.log(`✅ Auto-sync: Synced from Stripe - ${fromStripeResult.data?.created || 0} created, ${fromStripeResult.data?.updated || 0} updated`);

      // Check if we need to sync any memberships to Stripe
      const statusCheck = await this.checkMembershipSyncStatus();
      
      if (!statusCheck.success) {
        throw new Error(statusCheck.error || 'Failed to check sync status');
      }

      console.log(`🔍 Auto-sync: Found ${statusCheck.needsSync} memberships to sync to Stripe`);

      if (statusCheck.needsSync === 0) {
        console.log(`✅ Auto-sync: Synced to Stripe - 0 created, 0 updated`);
        return { 
          success: true, 
          message: `Products synced, all ${statusCheck.alreadySynced} memberships are already synced with Stripe` 
        };
      }

      console.log(`🔄 Found ${statusCheck.needsSync} memberships that need Stripe sync`);

      // Perform the sync
      const syncResult = await this.syncMembershipsToStripe();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Sync operation failed');
      }

      const message = `Auto-sync completed: Products synced, ${syncResult.synced} memberships synced, ${syncResult.failed} failed`;
      console.log(`✅ ${message}`);

      return { 
        success: true, 
        message,
        syncResult 
      };

    } catch (error) {
      console.error('❌ Auto-sync on startup failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default SubscriptionSyncService;
