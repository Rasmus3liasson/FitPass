import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from root directory
dotenv.config({ path: "../.env" });

if (
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("SUPABASE"))
  );
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
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
  stripe_price_id?: string;
  start_date?: string;
  end_date?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  // Get all membership plans
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .order("price");

    if (error) throw error;
    return data || [];
  }

  // Get single membership plan by ID
  async getMembershipPlanById(planId: string): Promise<MembershipPlan | null> {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Get membership plan by Stripe price ID
  async getMembershipPlanByStripePrice(
    stripePriceId: string
  ): Promise<MembershipPlan | null> {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("stripe_price_id", stripePriceId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
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
      .from("membership_plans")
      .update({
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update membership plan
  async updateMembershipPlan(
    planId: string,
    updates: {
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
    }
  ): Promise<MembershipPlan> {
    const { data, error } = await supabase
      .from("membership_plans")
      .update(updates)
      .eq("id", planId)
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
      .from("membership_plans")
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
    start_date?: string;
    end_date?: string;
  }): Promise<Subscription> {
    const { data, error } = await supabase
      .from("memberships")
      .insert({
        ...subscriptionData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update subscription
  // ⚠️ CRITICAL: Should ONLY be called from Stripe webhook handlers
  // Never call this directly from API endpoints - Stripe is the source of truth
  async updateSubscription(
    stripeSubscriptionId: string,
    updates: {
      status?: string;
      stripe_price_id?: string;
      start_date?: string;
      end_date?: string;
      canceled_at?: string;
    }
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from("memberships")
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

  // Get subscription by Stripe ID
  async getSubscriptionByStripeId(
    stripeSubscriptionId: string
  ): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  // Update user's membership
  async updateUserMembership(
    userId: string,
    updates: {
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
      subscription_status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from("memberships")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;
  }

  // Get or create user profile
  async getUserProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
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
      .from("memberships")
      .insert(membershipData)
      .select()
      .single();

    if (error) throw error;

    // Auto-sync with Stripe after creation
    try {
      const { AutoSyncService } = await import("./autoSync");
      const syncedData = await AutoSyncService.syncMembershipCreate(data);
      return syncedData;
    } catch (syncError) {
      console.error(
        "❌ Auto-sync failed after membership creation:",
        syncError
      );
      return data; // Return the created membership even if sync fails
    }
  }

  // Update membership record
  async updateMembership(
    membershipId: string,
    updates: {
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
      next_cycle_date?: string;
      updated_at?: string;
    }
  ): Promise<any> {
    // Get existing membership for auto-sync comparison
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("*")
      .eq("id", membershipId)
      .single();

    // Auto-sync with Stripe before update
    let finalUpdates = updates;
    if (existingMembership) {
      try {
        const { AutoSyncService } = await import("./autoSync");
        finalUpdates = await AutoSyncService.syncMembershipUpdate(
          membershipId,
          updates,
          existingMembership
        );
      } catch (syncError) {
        console.error(
          "❌ Auto-sync failed before membership update:",
          syncError
        );
        // Continue with original updates if sync fails
      }
    }

    const { data, error } = await supabase
      .from("memberships")
      .update(finalUpdates)
      .eq("id", membershipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Deactivate all memberships for a user
  async deactivateUserMemberships(userId: string): Promise<void> {
    // Auto-sync with Stripe before deactivation
    try {
      const { AutoSyncService } = await import("./autoSync");
      await AutoSyncService.syncMembershipDeactivation(userId);
    } catch (syncError) {
      console.error(
        "❌ Auto-sync failed before membership deactivation:",
        syncError
      );
      // Continue with deactivation even if sync fails
    }

    const { error } = await supabase
      .from("memberships")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;
  }

  // Get user's active membership
  async getUserActiveMembership(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .select(
        `
        *,
        membership_plan:plan_id (*)
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  // Create or update membership with proper logic to prevent duplicates
  async createOrUpdateMembership(membershipData: {
    user_id: string;
    plan_id: string;
    plan_type: string;
    credits: number;
    credits_used?: number;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    stripe_status?: string;
    start_date?: string;
    end_date?: string;
    is_production?: boolean;
  }): Promise<any> {
    // Check if user already has an active membership
    const existingMembership = await this.getUserActiveMembership(
      membershipData.user_id
    );

    if (existingMembership) {
      // If it's the same plan, just return the existing membership
      if (existingMembership.plan_id === membershipData.plan_id) {
        return existingMembership;
      }

      // Determine if we should update immediately or schedule the change
      const isProduction =
        membershipData.is_production ||
        process.env.EXPO_PUBLIC_ENVIRONMENT === "production";

      console.log("🤔 Scheduling Decision Analysis:", {
        isProduction: isProduction,
        hasStripeSubscription: !!existingMembership.stripe_subscription_id,
        stripeStatus: existingMembership.stripe_status,
        shouldSchedule:
          isProduction &&
          existingMembership.stripe_subscription_id &&
          existingMembership.stripe_status === "active",
      });

      if (
        isProduction &&
        existingMembership.stripe_subscription_id &&
        existingMembership.stripe_status === "active"
      ) {
        console.log(
          "✅ SCHEDULING REQUIRED - Production mode with active subscription"
        );
        // Production mode with active subscription - return existing membership with scheduling info
        return {
          ...existingMembership,
          requiresScheduling: true,
          newPlanId: membershipData.plan_id,
          newPlanTitle: membershipData.plan_type,
          newPlanCredits: membershipData.credits,
          newStripePriceId: membershipData.stripe_price_id,
        };
      } else {
        // Development mode, no subscription, or inactive subscription - update existing membership immediately
        console.log("⚡ IMMEDIATE UPDATE - Reason:", {
          isProduction: isProduction,
          hasStripeSubscription: !!existingMembership.stripe_subscription_id,
          stripeStatus: existingMembership.stripe_status,
          reason: !isProduction
            ? "Development mode"
            : !existingMembership.stripe_subscription_id
            ? "No Stripe subscription"
            : existingMembership.stripe_status !== "active"
            ? "Inactive subscription (" + existingMembership.stripe_status + ")"
            : "Unknown",
        });

        const updatedMembership = await this.updateMembership(
          existingMembership.id,
          {
            plan_id: membershipData.plan_id,
            plan_type: membershipData.plan_type,
            credits: membershipData.credits,
            credits_used: 0, // Reset credits when changing plans
            stripe_price_id: membershipData.stripe_price_id,
            stripe_status: membershipData.stripe_status || "active",
            start_date: membershipData.start_date || new Date().toISOString(),
            end_date: membershipData.end_date,
            updated_at: new Date().toISOString(),
          }
        );
        return updatedMembership;
      }
    } else {
      // No existing membership - create new one
      return await this.createMembership({
        ...membershipData,
        credits_used: membershipData.credits_used || 0,
        start_date: membershipData.start_date || new Date().toISOString(),
        end_date:
          membershipData.end_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Update membership by Stripe subscription ID
  // ⚠️ CRITICAL: Should ONLY be called from Stripe webhook handlers
  // Used when syncing subscription changes from Stripe webhooks
  // This ensures database is a read-only projection of Stripe state
  async updateMembershipBySubscriptionId(
    stripeSubscriptionId: string,
    updates: {
      plan_id?: string;
      plan_type?: string;
      credits?: string;
      stripe_price_id?: string;
      stripe_status?: string;
      next_cycle_date?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .eq("is_active", true)
      .select()
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }

  // Get active membership by Stripe subscription ID
  async getMembershipBySubscriptionId(
    stripeSubscriptionId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .eq("is_active", true)
      .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  }
}

export const dbService = new DatabaseService();
