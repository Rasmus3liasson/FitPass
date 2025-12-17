import { Membership, MembershipPlan } from "@/types";
import { supabase } from "../supabaseClient";

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .order("price");

  if (error) throw error;
  return data as MembershipPlan[];
}

export async function getMembershipPlansWithoutTrial(): Promise<
  MembershipPlan[]
> {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .not("price", "eq", 0)
    .order("price");

  if (error) throw error;

  return data as MembershipPlan[];
}

export async function getUserMembership(
  userId: string
): Promise<Membership | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select(
      `
      *,
      membership_plans:plan_id (*),
      membership_scheduled_changes!left (
        id,
        scheduled_plan_id,
        scheduled_plan_title,
        scheduled_plan_credits,
        scheduled_stripe_price_id,
        scheduled_change_date,
        stripe_schedule_id,
        status,
        membership_plans:scheduled_plan_id (
          id,
          title,
          credits
        )
      )
    `
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("membership_scheduled_changes.status", ["pending", "confirmed"])
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  
  if (!data) return null;

  // Construct scheduledChange object from joined table if scheduled change exists
  let scheduledChange = undefined;
  if (data.membership_scheduled_changes && data.membership_scheduled_changes.length > 0) {
    const scheduledChangeData = data.membership_scheduled_changes[0];
    const scheduledPlan = scheduledChangeData.membership_plans;
    
    scheduledChange = {
      planId: scheduledChangeData.scheduled_plan_id,
      planTitle: scheduledChangeData.scheduled_plan_title || scheduledPlan?.title || '',
      planCredits: scheduledChangeData.scheduled_plan_credits || scheduledPlan?.credits || 0,
      nextBillingDate: scheduledChangeData.scheduled_change_date,
      confirmed: scheduledChangeData.status === 'confirmed',
      scheduleId: scheduledChangeData.stripe_schedule_id,
      error: undefined
    };
  }

  return {
    ...data,
    scheduledChange
  } as Membership;
}

// Function to update membership credits after a visit or booking
export async function updateMembershipCredits(
  userId: string,
  creditsUsed: number
) {
  try {
    // First get current membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("id, credits_used, credits")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) throw new Error("No active membership found");

    // Calculate remaining credits
    const remainingCredits = Math.max(
      0,
      membership.credits - (membership.credits_used + creditsUsed)
    );

    // Update membership credits used
    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        credits_used: membership.credits_used + creditsUsed,
      })
      .eq("id", membership.id);

    if (updateError) throw updateError;

    // Update profile credits
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        credits: remainingCredits,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    return true;
  } catch (error) {
    console.error("Error updating membership credits:", error);
    throw error;
  }
}

// Updated function to handle user membership selection and credit updates
/**
 * STRIPE-FIRST ARCHITECTURE: Create new subscription
 * 
 * CRITICAL: Never directly insert membership into database
 * Flow: Call Stripe API → Stripe creates subscription → Webhook syncs to DB
 * 
 * This ensures Stripe is the single source of truth for subscription state.
 */
export async function createUserMembership(
  userId: string,
  planId: string
): Promise<Membership & { webhookPending?: boolean; subscriptionId?: string }> {
  try {
    // First get the membership plan to get the Stripe price ID
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("credits, title, stripe_price_id")
      .eq("id", planId)
      .single();

    if (planError) throw planError;

    if (!plan.stripe_price_id) {
      throw new Error("Plan does not have a Stripe price ID configured");
    }

    // Check if user already has an active membership
    const { data: existingMembership, error: existingError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (existingError) throw existingError;

    // If user already has an active membership, update it instead of creating a new one
    if (existingMembership) {
      // Double check: if they're selecting the same plan, just return the existing membership
      if (existingMembership.plan_id === planId) {
        return existingMembership;
      }
      
      return await updateMembershipPlan(userId, planId);
    }

    // Create subscription in Stripe (via backend API)
    // DO NOT insert into database - webhook will handle that
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log("📞 Calling Stripe API to create subscription...");
    console.log("   API URL:", apiUrl);
    console.log("   User ID:", userId);
    console.log("   Price ID:", plan.stripe_price_id);
    
    const response = await fetch(`${apiUrl}/api/stripe/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId: plan.stripe_price_id,
      })
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("❌ Subscription creation failed:", errorData);
      
      // If user already has subscription, this is expected - direct them to update
      if (errorData.error?.includes("already has an active subscription")) {
        throw new Error("Du har redan ett aktivt medlemskap. Använd uppdatera istället för att skapa nytt.");
      }
      
      throw new Error(errorData.error || `Failed to create subscription: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Subscription created:", result);
    
    // Return a temporary membership object with webhookPending flag
    // Frontend will poll for webhook completion
    return {
      id: 'pending',
      user_id: userId,
      plan_id: planId,
      plan_type: plan.title,
      credits: plan.credits,
      credits_used: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      webhookPending: true,
      subscriptionId: result.subscription.id,
    } as Membership & { webhookPending: boolean; subscriptionId: string };

  } catch (error) {
    console.error("Error creating user membership:", error);
    throw error;
  }
}

export async function cancelScheduledMembershipChange(
  membershipId: string,
  scheduleId?: string
): Promise<void> {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${apiUrl}/api/stripe/cancel-scheduled-subscription-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        membershipId,
        scheduleId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel scheduled change: ${errorText}`);
    }

  } catch (error) {
    console.error("Error canceling scheduled membership change:", error);
    throw error;
  }
}

export async function updateMembershipPlan(
  userId: string,
  planId: string
): Promise<Membership> {
  try {
    // Check environment to determine update behavior
    const environment = process.env.EXPO_PUBLIC_ENVIRONMENT;
    const isProduction = environment === 'production';
    
    // First get the membership plan to get the credits and Stripe info
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("credits, title, stripe_price_id")
      .eq("id", planId)
      .single();

    if (planError) throw planError;

    // Get current membership to check if we need to sync with Stripe
    const { data: currentMembership, error: currentError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (currentError) throw currentError;
    
    // If no active membership, create a new subscription instead
    if (!currentMembership) {
      console.log("⚠️ No active membership found - creating new subscription instead");
      return await createUserMembership(userId, planId);
    }

    // Check for existing scheduled changes - let the backend handle cancellation atomically
    if (isProduction && currentMembership.stripe_subscription_id) {
      const { data: existingScheduledChange, error: scheduleError } = await supabase
        .from("membership_scheduled_changes")
        .select("*")
        .eq("membership_id", currentMembership.id)
        .in("status", ["pending", "confirmed"])
        .maybeSingle();

      if (existingScheduledChange) {
        // If it's the same plan, return the existing state
        if (existingScheduledChange.scheduled_plan_id === planId) {
          console.log('📋 Same plan already scheduled, returning current state');
          return {
            ...currentMembership,
            scheduledChange: {
              planId: planId,
              planTitle: plan.title,
              planCredits: plan.credits,
              nextBillingDate: existingScheduledChange.scheduled_change_date,
              confirmed: existingScheduledChange.status === 'confirmed',
              scheduleId: existingScheduledChange.stripe_schedule_id
            }
          };
        }
        
        // Different plan - let the backend handle cancellation and creation atomically
        console.log('🔄 Different plan detected - backend will handle existing scheduled change cancellation');
      }
    }

    let membership;
    
    if (isProduction && currentMembership.stripe_subscription_id) {
      // Production: Schedule change for next billing cycle
      // Keep the current membership as-is for now
      // The actual plan change will be handled by Stripe webhook when billing cycle renews
      membership = {
        ...currentMembership,
        // Add a flag to indicate this is a scheduled change
        scheduledChange: {
          planId: planId,
          planTitle: plan.title,
          planCredits: plan.credits,
          nextBillingDate: currentMembership.next_cycle_date,
          confirmed: undefined, // Will be set based on API response
          error: undefined
        }
      };
    } else {
      // Development or new member: Webhook will update database
      // Don't update DB directly - return current state with webhookPending flag
      membership = {
        ...currentMembership,
        // Keep current state until webhook syncs
        webhookPending: true
      };
    }

    // Profile credits will be updated by webhook after subscription syncs
    // DO NOT update directly here

    // 🔄 AUTO-SYNC: Handle Stripe subscription updates based on environment
    if (currentMembership.stripe_subscription_id && plan.stripe_price_id) {
      const syncEndpoint = isProduction ? 
        '/api/stripe/schedule-subscription-update' : 
        '/api/stripe/sync-subscription-update';
      
      try {
        // Use fallback URL if environment variable is not set
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

        /**
         * CRITICAL: Call Stripe API only, database updates via webhook
         * 
         * This endpoint updates Stripe, then returns immediately.
         * Database will be updated when customer.subscription.updated webhook fires.
         * 
         * We DON'T wait here because:
         * 1. Webhooks may take 1-2 seconds
         * 2. Better UX to show "Updating..." and poll separately
         * 3. Avoids blocking the UI thread
         */
        const response = await fetch(`${apiUrl}${syncEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: currentMembership.stripe_subscription_id,
            newPriceId: plan.stripe_price_id,
            membershipId: membership.id,
            immediate: !isProduction
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // For production scheduling, add success confirmation to membership
          if (isProduction && result.schedule) {
            membership.scheduledChange.confirmed = true;
            membership.scheduledChange.scheduleId = result.schedule.id;
            membership.scheduledChange.nextBillingDate = result.scheduledFor;
          } else if (!isProduction) {
            /**
             * Development mode: Stripe updated, but database update is pending
             * 
             * Result includes:
             * - pending: true (database not updated yet)
             * - message: "Database will sync via webhook"
             * 
             * Frontend should:
             * 1. Show "Updating..." state
             * 2. Poll for sync completion
             * 3. Refetch membership data after confirmation
             */
            membership.webhookPending = true;
            membership.subscriptionId = currentMembership.stripe_subscription_id;
          }
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }

          // Check for currency mismatch error
          if (response.status === 400 && errorData.error?.includes('Currency mismatch')) {
            console.warn("💰 AUTO-SYNC: Currency mismatch detected - subscription requires same currency");
            // For development, continue but for production scheduling this is critical
            if (isProduction) {
              throw new Error('Currency mismatch: Cannot schedule plan change with different currency');
            }
          } else {
            const errorMessage = `Stripe ${isProduction ? 'scheduling' : 'sync'} failed: ${errorData.error || errorText}`;
            console.warn(`⚠️ AUTO-SYNC: ${errorMessage}`, {
              status: response.status,
              error: errorData.error || errorText,
              url: `${apiUrl}${syncEndpoint}`
            });
            
            // For production scheduling, check if endpoint exists
            if (isProduction) {
              if (response.status === 404) {
                // Endpoint doesn't exist yet - this is expected during development
                // Don't update database - keep the scheduled change info
                membership.scheduledChange.confirmed = false;
                membership.scheduledChange.error = 'Scheduling endpoint not available';
              } else {
                throw new Error(errorMessage);
              }
            }
          }
        }
      } catch (syncError) {
        console.warn(`⚠️ AUTO-SYNC: Stripe ${isProduction ? 'scheduling' : 'sync'} error:`, syncError);
        
        // For production scheduling, don't fall back to immediate update
        if (isProduction) {
          // Keep the scheduled change info without updating database
          membership.scheduledChange.confirmed = false;
          membership.scheduledChange.error = 'Connection error to scheduling service';
        }
        // For development, continue - webhook will handle database update
      }
    } else {
      // If membership has no Stripe subscription but plan has stripe_price_id, create one
      if (!currentMembership.stripe_subscription_id && plan.stripe_price_id) {
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
          
          const response = await fetch(`${apiUrl}/api/stripe/create-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              priceId: plan.stripe_price_id,
              membershipId: membership.id
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log("✅ Stripe subscription created, webhook will sync to database");
            
            // Webhook will update membership with subscription ID
            // Mark as pending so UI knows to poll for completion
            membership.webhookPending = true;
            membership.subscriptionId = result.subscription?.id;
          } else {
            const errorText = await response.text();
            console.warn("⚠️ Failed to create Stripe subscription:", errorText);
          }
        } catch (createError) {
          console.warn("⚠️ Error creating Stripe subscription:", createError);
        }
      }
    }

    // Return the membership (may include scheduledChange for production mode)
    return membership;
  } catch (error) {
    console.error("Error updating user membership:", error);
    throw error;
  }
}
