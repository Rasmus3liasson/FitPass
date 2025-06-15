export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: 'month' | 'year';
        };
      };
    }>;
  };
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
  product: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  metadata: Record<string, string>;
}

export interface CreateSubscriptionRequest {
  priceId: string;
  userId: string;
}

export interface CreateCustomerRequest {
  email: string;
  name?: string;
  userId: string;
}

export interface SubscriptionWithDetails extends StripeSubscription {
  price: StripePrice;
  product: StripeProduct;
}