import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from root directory
dotenv.config({ path: '../.env' });

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface MembershipPlan {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: number;
  popular: boolean;
  credits: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  membership_plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  // Get all membership plans
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('price');

    if (error) throw error;
    return data || [];
  }

  // Update membership plan with Stripe IDs
  async updateMembershipPlanStripeIds(
    planId: string,
    stripeProductId: string,
    stripePriceId: string
  ): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create subscription record
  async createSubscription(subscriptionData: {
    user_id: string;
    membership_plan_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
  }): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update subscription
  async updateSubscription(
    stripeSubscriptionId: string,
    updates: {
      status?: string;
      current_period_start?: string;
      current_period_end?: string;
      cancel_at_period_end?: boolean;
      canceled_at?: string;
    }
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get subscription by Stripe ID
  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Update user's membership
  async updateUserMembership(
    userId: string,
    updates: {
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
      subscription_status?: string;
      current_period_start?: string;
      current_period_end?: string;
      cancel_at_period_end?: boolean;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
  }

  // Get or create user profile
  async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Update user's Stripe customer ID
  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', userId);

    if (error) throw error;
  }
}

export const dbService = new DatabaseService();
