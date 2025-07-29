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

  // Get single membership plan by ID
  async getMembershipPlanById(planId: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Get membership plan by Stripe price ID
  async getMembershipPlanByStripePrice(stripePriceId: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('stripe_price_id', stripePriceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
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

  // Update membership plan
  async updateMembershipPlan(planId: string, updates: {
    title?: string;
    description?: string;
    price?: number;
    credits?: number;
    features?: string[];
    popular?: boolean;
    button_text?: string;
    stripe_product_id?: string;
    stripe_price_id?: string;
    updated_at?: string;
  }): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create membership plan
  async createMembershipPlan(planData: {
    title: string;
    description: string;
    price: number;
    credits: number;
    features: string[];
    popular: boolean;
    button_text: string;
    stripe_product_id?: string;
    stripe_price_id?: string;
    created_at: string;
    updated_at: string;
  }): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from('membership_plans')
      .insert(planData)
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

  // Create membership record
  async createMembership(membershipData: {
    user_id: string;
    plan_type: string;
    credits: number;
    credits_used?: number;
    has_used_trial?: boolean;
    trial_end_date?: string;
    trial_days_remaining?: number;
    start_date: string;
    end_date?: string;
    is_active?: boolean;
    plan_id?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    stripe_status?: string;
    created_at: string;
    updated_at?: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .insert(membershipData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update membership record
  async updateMembership(membershipId: string, updates: {
    plan_type?: string;
    credits?: number;
    credits_used?: number;
    has_used_trial?: boolean;
    trial_end_date?: string;
    trial_days_remaining?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    plan_id?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    stripe_status?: string;
    updated_at?: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Deactivate all memberships for a user
  async deactivateUserMemberships(userId: string): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
  }

  // Get user's active membership
  async getUserActiveMembership(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_plan:plan_id (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export const dbService = new DatabaseService();
