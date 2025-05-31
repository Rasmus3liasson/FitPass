import { Membership, MembershipPlan } from "@/types";
import { supabase } from "../browser";

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

    // Create the membership
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
    // First get the membership plan to get the credits
    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("credits, title")
      .eq("id", planId)
      .single();

    if (planError) throw planError;

    // Update the membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .update({
        plan_id: planId,
        plan_type: plan.title,
        credits: plan.credits,
        credits_used: 0,
        is_active: true,
      })
      .eq("user_id", userId)
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
    console.error("Error updating user membership:", error);
    throw error;
  }
}
