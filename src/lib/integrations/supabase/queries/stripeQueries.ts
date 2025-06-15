import { supabase } from "../supabaseClient";

export interface StripeCustomerData {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface StripeSubscriptionData {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Create or get Stripe customer
export async function createStripeCustomer(
  userId: string,
  stripeCustomerId: string,
  email: string
): Promise<StripeCustomerData> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .insert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      email,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStripeCustomer(userId: string): Promise<StripeCustomerData | null> {
  const { data, error } = await supabase
    .from("stripe_customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Subscription management
export async function createStripeSubscription(
  userId: string,
  subscriptionData: {
    stripe_subscription_id: string;
    stripe_customer_id: string;
    stripe_price_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  }
): Promise<StripeSubscriptionData> {
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .insert({
      user_id: userId,
      ...subscriptionData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStripeSubscription(
  stripeSubscriptionId: string,
  updates: Partial<StripeSubscriptionData>
): Promise<StripeSubscriptionData> {
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .update(updates)
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserStripeSubscription(userId: string): Promise<StripeSubscriptionData | null> {
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function cancelStripeSubscription(
  stripeSubscriptionId: string
): Promise<StripeSubscriptionData> {
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all subscriptions for admin
export async function getAllStripeSubscriptions(): Promise<StripeSubscriptionData[]> {
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}