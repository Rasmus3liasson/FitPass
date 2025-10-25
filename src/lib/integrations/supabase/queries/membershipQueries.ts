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
      membership_plans:plan_id (*)
    `
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  return data;
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
      console.log("🔄 User already has active membership, updating instead of creating new one");
      console.log("📋 Existing membership:", existingMembership.id, "plan:", existingMembership.plan_type);
      console.log("🆕 Updating to new plan:", planId);
      
      // Double check: if they're selecting the same plan, just return the existing membership
      if (existingMembership.plan_id === planId) {
        console.log("ℹ️ User selected same plan, returning existing membership");
        return existingMembership;
      }
      
      return await updateMembershipPlan(userId, planId);
    }

    console.log("✨ Creating new membership for user:", userId, "plan:", planId);

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

export async function updateMembershipPlan(
  userId: string,
  planId: string
): Promise<Membership> {
  try {
    // First get the membership plan to get the credits and Stripe info
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("credits, title, stripe_price_id")
      .eq("id", planId)
      .single();

    console.log("📋 Plan data:", plan);
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

    // Update the specific membership by ID to ensure we only update one record
    const { data: membership, error: membershipError } = await supabase
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

    // Update user's profile with the credits
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        credits: plan.credits,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 🔄 AUTO-SYNC: If membership has Stripe subscription, sync the plan change
    if (currentMembership.stripe_subscription_id && plan.stripe_price_id) {
      console.log("🔄 Starting Stripe sync:", {
        subscriptionId: currentMembership.stripe_subscription_id,
        newPriceId: plan.stripe_price_id,
        membershipId: membership.id
      });
      
      try {
        // Use fallback URL if environment variable is not set
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
        console.log("🌐 API URL:", apiUrl);

        // Call backend to sync the subscription change
        const response = await fetch(`${apiUrl}/api/stripe/sync-subscription-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: currentMembership.stripe_subscription_id,
            newPriceId: plan.stripe_price_id,
            membershipId: membership.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Stripe sync successful:", result);
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
          } else {
            console.warn("⚠️ AUTO-SYNC: Stripe sync failed, but database updated", {
              status: response.status,
              error: errorData.error || errorText,
              url: `${apiUrl}/api/stripe/sync-subscription-update`
            });
          }
        }
      } catch (syncError) {
        console.warn("⚠️ AUTO-SYNC: Stripe sync error:", syncError);
        // Continue - database is already updated
      }
    } else {
      console.log("⚠️ Stripe sync skipped:", {
        hasStripeSubscriptionId: !!currentMembership.stripe_subscription_id,
        hasStripePriceId: !!plan.stripe_price_id,
        subscriptionId: currentMembership.stripe_subscription_id,
        priceId: plan.stripe_price_id
      });

      // If membership has no Stripe subscription but plan has stripe_price_id, create one
      if (!currentMembership.stripe_subscription_id && plan.stripe_price_id) {
        console.log("🚀 Creating new Stripe subscription for membership:", membership.id);
        
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
            console.log("✅ Stripe subscription created:", result);
            
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
              } else {
                console.log("✅ Membership updated with Stripe subscription ID:", result.subscription.id);
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

    return membership;
  } catch (error) {
    console.error("Error updating user membership:", error);
    throw error;
  }
}
