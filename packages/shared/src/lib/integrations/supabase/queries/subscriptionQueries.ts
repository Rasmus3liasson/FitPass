import { Membership, Subscription } from "../../../../types";
import { supabase } from "../supabaseClient";

// Create a new subscription record
export async function createSubscription(subscriptionData: {
  user_id: string;
  membership_plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
}): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert(subscriptionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user's active subscription
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      membership_plan:membership_plan_id (*)
    `)
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Update subscription status (used by webhooks)
export async function updateSubscriptionStatus(
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
    .from("subscriptions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update membership with Stripe subscription info
export async function updateMembershipWithStripe(
  userId: string,
  updates: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  }
): Promise<Membership> {
  const { data, error } = await supabase
    .from("memberships")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Cancel subscription
export async function cancelSubscription(stripeSubscriptionId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get subscription by Stripe ID (for webhook processing)
export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Create Stripe customer record
export async function createStripeCustomer(userId: string, stripeCustomerId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", userId);

  if (error) throw error;
}

// Get user's Stripe customer ID
export async function getUserStripeCustomerId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.stripe_customer_id || null;
}
