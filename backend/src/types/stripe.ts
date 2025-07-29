import Stripe from 'stripe';

// Stripe-related types
export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  metadata?: Stripe.MetadataParam;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: Stripe.Subscription.Status;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number | null;
        currency: string;
        recurring: {
          interval: Stripe.Price.Recurring.Interval;
        } | null;
        product: string | Stripe.Product;
      };
    }>;
  };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number | null;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
    country: string;
  };
  billing_details?: Stripe.PaymentMethod.BillingDetails;
  created: number;
  metadata?: Stripe.MetadataParam;
}

export interface AutoSyncStatus {
  unsyncedMemberships: number;
  incompleteSubscriptions: number;
  needsAttention: boolean;
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

export interface ComprehensiveSyncResult {
  success: boolean;
  syncedFromStripe: SyncResult;
  syncedToStripe: SyncResult;
  errors: string[];
}
