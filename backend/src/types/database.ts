// Database entity types
export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  stripe_customer_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MembershipPlan {
  id: string;
  title: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripe_price_id: string;
  stripe_product_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_type: string;
  credits: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_status?: 'active' | 'inactive' | 'canceled' | 'incomplete' | 'past_due';
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMembershipData {
  user_id: string;
  plan_type: string;
  credits: number;
  plan_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_status?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateMembershipData {
  plan_id?: string;
  plan_type?: string;
  credits?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_status?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  updated_at: string;
}
