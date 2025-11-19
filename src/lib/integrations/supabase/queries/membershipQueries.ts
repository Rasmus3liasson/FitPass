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
export async function createUserMembership(
  userId: string,
  planId: string
): Promise<Membership> {
  try {
    // First get the membership plan to get the credits
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("credits, title")
      .eq("id", planId)
      .single();

    if (planError) throw planError;

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



    // Create the membership only if user doesn't have an active one
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_type: plan.title,
        credits: plan.credits,
        credits_used: 0,
        is_active: true,
      })
      .select()
      .single();

    if (membershipError) throw membershipError;

    // Update user's profile with the credits
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        credits: plan.credits,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    return membership;
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
    
    const response = await fetch(`${apiUrl}/api/stripe/cancel-scheduled-update`, {
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
    if (!currentMembership) {
      throw new Error("No active membership found for user");
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
      // Development or new member: Update immediately
      const { data: updatedMembership, error: membershipError } = await supabase
        .from("memberships")
        .update({
          plan_id: planId,
          plan_type: plan.title,
          credits: plan.credits,
          credits_used: 0,
          is_active: true,
        })
        .eq("id", currentMembership.id)
        .select()
        .single();

      if (membershipError) throw membershipError;
      membership = updatedMembership;
    }

    // Update user's profile with the credits (only for immediate updates)
    if (!isProduction || !currentMembership.stripe_subscription_id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          credits: plan.credits,
        })
        .eq("id", userId);

      if (profileError) throw profileError;
    }

    // 🔄 AUTO-SYNC: Handle Stripe subscription updates based on environment
    if (currentMembership.stripe_subscription_id && plan.stripe_price_id) {
      const syncEndpoint = isProduction ? 
        '/api/stripe/schedule-subscription-update' : 
        '/api/stripe/sync-subscription-update';
      
      try {
        // Use fallback URL if environment variable is not set
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

        // Call backend to sync or schedule the subscription change
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
        // For development, continue - database is already updated
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
            
            // Update the membership with the new Stripe subscription ID
            if (result.subscription?.id) {
              const { error: updateError } = await supabase
                .from("memberships")
                .update({
                  stripe_subscription_id: result.subscription.id,
                  stripe_customer_id: result.subscription.customer,
                  stripe_status: result.subscription.status
                })
                .eq("id", membership.id);
                
              if (updateError) {
                console.warn("⚠️ Failed to update membership with Stripe subscription ID:", updateError);
              }
            }
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
