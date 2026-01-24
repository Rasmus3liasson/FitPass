import { Membership, MembershipPlan } from '../../../../types';
import { supabase } from '../supabaseClient';

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase.from('membership_plans').select('*').order('price');

  if (error) throw error;
  return data as MembershipPlan[];
}

export async function getMembershipPlansWithoutTrial(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .not('price', 'eq', 0)
    .order('price');

  if (error) throw error;

  return data as MembershipPlan[];
}

export async function getUserMembership(userId: string): Promise<Membership | null> {
  const { data, error } = await supabase
    .from('memberships')
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
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('membership_scheduled_changes.status', ['pending', 'confirmed'])
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

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
      error: undefined,
    };
  }

  return {
    ...data,
    scheduledChange,
  } as Membership;
}

// Function to update membership credits after a visit or booking
export async function updateMembershipCredits(userId: string, creditsUsed: number) {
  try {
    // First get current membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('id, credits_used, credits')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) throw new Error('No active membership found');

    // Calculate remaining credits
    const remainingCredits = Math.max(
      0,
      membership.credits - (membership.credits_used + creditsUsed)
    );

    // Update membership credits used
    const { error: updateError } = await supabase
      .from('memberships')
      .update({
        credits_used: membership.credits_used + creditsUsed,
      })
      .eq('id', membership.id);

    if (updateError) throw updateError;

    // Update profile credits
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        credits: remainingCredits,
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return true;
  } catch (error) {
    console.error('Error updating membership credits:', error);
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
      .from('membership_plans')
      .select('credits, title, stripe_price_id')
      .eq('id', planId)
      .single();

    if (planError) throw planError;

    if (!plan.stripe_price_id) {
      throw new Error('Plan does not have a Stripe price ID configured');
    }

    // Always call backend API - it will handle both new subscriptions and scheduling changes
    // Backend has logic to:
    // 1. Check for existing subscriptions (DB + Stripe)
    // 2. If exists with same plan → return already subscribed
    // 3. If exists with different plan → schedule change for next billing cycle
    // 4. If no subscription → create new subscription
    // DO NOT insert into database - webhook will handle that
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

    console.log('📞 Calling Stripe API to create subscription...');
    console.log('   API URL:', apiUrl);
    console.log('   User ID:', userId);
    console.log('   Price ID:', plan.stripe_price_id);

    const response = await fetch(`${apiUrl}/api/stripe/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        priceId: plan.stripe_price_id,
      }),
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Subscription creation failed:', errorData);

      // If user already has subscription, this is expected - direct them to update
      if (errorData.error?.includes('already has an active subscription')) {
        throw new Error(
          'Du har redan ett aktivt medlemskap. Använd uppdatera istället för att skapa nytt.'
        );
      }

      throw new Error(errorData.error || `Failed to create subscription: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Backend response:', JSON.stringify(result, null, 2));
    console.log('   - success:', result.success);
    console.log('   - scheduled:', result.scheduled);
    console.log('   - alreadySubscribed:', result.alreadySubscribed);
    console.log('   - pending:', result.pending);
    console.log('   - subscription.id:', result.subscription?.id);

    // Handle different response scenarios:
    // 1. alreadySubscribed: User selected same plan they already have
    // 2. scheduled: Change scheduled for next billing cycle (existing subscription)
    // 3. pending: New subscription created, waiting for webhook

    if (result.alreadySubscribed) {
      console.log('📋 Already subscribed - fetching current membership');
      // User already has this exact plan - fetch and return current membership
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (existingMembership) {
        return existingMembership;
      }
    }

    if (result.scheduled) {
      console.log('📅 Scheduled change detected - fetching current membership');
      // Plan change scheduled for next billing cycle
      // Fetch current membership and add scheduled change info
      const { data: currentMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (currentMembership) {
        return {
          ...currentMembership,
          scheduledChange: result.scheduledChange
            ? {
                planId: result.scheduledChange.new_plan,
                planTitle: result.scheduledChange.new_plan_title,
                nextBillingDate: result.scheduledChange.effective_date,
                confirmed: true,
                scheduled: true, // Flag to indicate this is a scheduled change, not immediate
              }
            : undefined,
        } as Membership & { scheduledChange?: any };
      }

      // If no membership found in DB, trigger manual sync to create it from Stripe
      console.log('⚠️ No membership found in DB, triggering manual sync...');
      const subscriptionId = result.scheduledChange?.subscription_id;
      if (subscriptionId) {
        try {
          const syncResponse = await fetch(`${apiUrl}/api/stripe/sync-subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscriptionId }),
          });

          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('✅ Manual sync successful, membership created');

            if (syncResult.membership) {
              return {
                ...syncResult.membership,
                scheduledChange: result.scheduledChange
                  ? {
                      planId: result.scheduledChange.new_plan,
                      planTitle: result.scheduledChange.new_plan_title,
                      nextBillingDate: result.scheduledChange.effective_date,
                      confirmed: true,
                      scheduled: true,
                    }
                  : undefined,
              } as Membership & { scheduledChange?: any };
            }
          }
        } catch (syncError) {
          console.error('❌ Manual sync failed:', syncError);
        }
      }

      // Last resort: return a temporary membership object
      console.log('⚠️ Returning temporary membership object');
      return {
        id: 'pending',
        user_id: userId,
        plan_id: planId,
        plan_type: plan.title,
        credits: plan.credits,
        credits_used: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        scheduledChange: result.scheduledChange
          ? {
              planId: result.scheduledChange.new_plan,
              planTitle: result.scheduledChange.new_plan_title,
              nextBillingDate: result.scheduledChange.effective_date,
              confirmed: true,
              scheduled: true,
            }
          : undefined,
      } as Membership & { scheduledChange?: any };
    }

    // New subscription created - manually trigger sync and return result
    const subscriptionId = result.subscription?.id || result.subscriptionId;
    console.log('🔍 Extracted subscription ID:', subscriptionId);
    console.log('   - Type:', typeof subscriptionId);
    console.log("   - Starts with 'sub_':", subscriptionId?.startsWith?.('sub_'));

    if (subscriptionId && subscriptionId !== 'pending' && subscriptionId.startsWith('sub_')) {
      console.log('🔄 Triggering manual sync for subscription:', subscriptionId);

      try {
        // Call manual sync endpoint
        const syncResponse = await fetch(`${apiUrl}/api/stripe/sync-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId,
          }),
        });

        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('✅ Manual sync successful:', syncResult);

          if (syncResult.membership) {
            // Return the synced membership directly
            return syncResult.membership as Membership;
          }
        } else {
          console.warn('⚠️ Manual sync failed, falling back to pending status');
        }
      } catch (syncError) {
        console.error('❌ Error triggering manual sync:', syncError);
      }
    } else {
      console.log('⚠️ Invalid or pending subscription ID, skipping manual sync:', subscriptionId);
    }

    // Fallback: Return pending status if sync failed or no subscription ID
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
      subscriptionId: subscriptionId || 'pending',
    } as Membership & { webhookPending: boolean; subscriptionId: string };
  } catch (error) {
    console.error('Error creating user membership:', error);
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
        scheduleId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel scheduled change: ${errorText}`);
    }
  } catch (error) {
    console.error('Error canceling scheduled membership change:', error);
    throw error;
  }
}

export async function updateMembershipPlan(userId: string, planId: string): Promise<Membership> {
  console.log('🔄 Updating membership plan - delegating to createUserMembership');
  // The createUserMembership function now handles both:
  // 1. Creating new subscriptions
  // 2. Scheduling changes for existing subscriptions
  // It checks Stripe directly for existing subscriptions, so no need for separate logic
  return await createUserMembership(userId, planId);
}
