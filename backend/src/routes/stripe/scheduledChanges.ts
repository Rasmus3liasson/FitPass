import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { dbService, supabase } from "../../services/database";
import { stripe } from "../../services/stripe";

const router = Router();

// Schedule subscription update for next billing cycle
router.post("/schedule-subscription-update", async (req: Request, res: Response) => {
  try {
    const { subscriptionId, newPriceId, membershipId } = req.body;

    if (!subscriptionId || !newPriceId || !membershipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subscriptionId, newPriceId, membershipId'
      });
    }

    // Check for existing scheduled changes and cancel them first
    const { data: existingScheduledChange } = await supabase
      .from('membership_scheduled_changes')
      .select('*')
      .eq('membership_id', membershipId)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (existingScheduledChange) {
      // Check if it's the same plan being scheduled
      const existingPlan = await dbService.getMembershipPlanByStripePrice(existingScheduledChange.scheduled_stripe_price_id);
      const newPlan = await dbService.getMembershipPlanByStripePrice(newPriceId);
      
      if (existingPlan && newPlan && existingPlan.id === newPlan.id) {
        // Same plan already scheduled - return existing schedule
        console.log('📋 Same plan already scheduled, returning existing schedule');
        return res.json({
          success: true,
          message: 'Plan already scheduled for next billing cycle',
          schedule: {
            id: existingScheduledChange.stripe_schedule_id,
            planTitle: existingScheduledChange.scheduled_plan_title,
            scheduledFor: existingScheduledChange.scheduled_change_date
          },
          scheduledFor: existingScheduledChange.scheduled_change_date
        });
      }
      
      // Different plan - update existing schedule instead of creating new one
      console.log('🔄 Updating existing scheduled change with new plan');
      
      try {
        // Cancel the existing Stripe schedule
        if (existingScheduledChange.stripe_schedule_id) {
          await stripe.subscriptionSchedules.cancel(existingScheduledChange.stripe_schedule_id);
          console.log('✅ Canceled existing Stripe schedule');
        }
        
        // We'll update the existing record instead of creating a new one
        // This will be handled in the creation section below by checking for existing record
        console.log('✅ Will update existing scheduled change record');
      } catch (cancelError) {
        console.error('❌ Failed to cancel existing Stripe schedule:', cancelError);
        return res.status(500).json({
          success: false,
          error: "Failed to cancel existing Stripe schedule"
        });
      }
    }

    // Get current subscription and new price details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPrice = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(newPriceId);

    // Check if currencies are compatible
    if (currentPrice.currency !== newPrice.currency) {
      console.warn('⚠️ SCHEDULE: Currency mismatch detected - cannot schedule subscription change');
      
      return res.status(400).json({
        success: false,
        error: `Currency mismatch: Current subscription uses ${currentPrice.currency.toUpperCase()}, new price uses ${newPrice.currency.toUpperCase()}. Cannot change currency on existing subscriptions.`,
        message: 'Currency change requires new subscription'
      });
    }

    // Schedule the subscription change using Stripe's schedule API
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;
      
    const scheduleParams: Stripe.SubscriptionScheduleCreateParams = {
      customer: customerId,
      start_date: subscription.current_period_end, // Start at next billing cycle
      end_behavior: 'release',
      phases: [
        {
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
          iterations: 1,
        },
      ],
    };

    const subscriptionSchedule = await stripe.subscriptionSchedules.create(scheduleParams);

    // Get the new plan details to store with the scheduled change
    const newPlan = await dbService.getMembershipPlanByStripePrice(newPriceId);
    if (!newPlan) {
      console.error('❌ Could not find plan for price:', newPriceId);
      // Cancel the schedule if we can't find the plan
      await stripe.subscriptionSchedules.cancel(subscriptionSchedule.id);
      throw new Error('Plan not found for the scheduled change');
    }

    // Update existing scheduled change record or create new one
    let scheduledChange;
    
    if (existingScheduledChange) {
      // Update the existing record
      const { data: updatedChange, error: updateError } = await supabase
        .from('membership_scheduled_changes')
        .update({
          scheduled_plan_id: newPlan.id,
          scheduled_plan_title: newPlan.title,
          scheduled_plan_credits: newPlan.credits,
          scheduled_stripe_price_id: newPriceId,
          scheduled_change_date: new Date(subscription.current_period_end * 1000).toISOString(),
          stripe_schedule_id: subscriptionSchedule.id,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingScheduledChange.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Failed to update existing scheduled change:', updateError);
        // Cancel the new schedule if database update fails
        await stripe.subscriptionSchedules.cancel(subscriptionSchedule.id);
        throw updateError;
      }
      
      scheduledChange = updatedChange;
      console.log('✅ Updated existing scheduled change record');
    } else {
      // Create new scheduled change record
      scheduledChange = await dbService.createScheduledChange({
        membershipId: membershipId,
        scheduledPlanId: newPlan.id,
        scheduledPlanTitle: newPlan.title,
        scheduledPlanCredits: newPlan.credits,
        scheduledStripePriceId: newPriceId,
        scheduledChangeDate: new Date(subscription.current_period_end * 1000).toISOString(),
        stripeScheduleId: subscriptionSchedule.id,
        status: 'confirmed'
      });
      console.log('✅ Created new scheduled change record');
    }

    // Update membership to indicate there's a scheduled change
    const { data: membershipUpdate, error: updateError } = await supabase
      .from('memberships')
      .update({
        next_cycle_date: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_status: 'scheduled_change',
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update membership with schedule info:', updateError);
      // If database update fails, cancel the schedule
      await stripe.subscriptionSchedules.cancel(subscriptionSchedule.id);
      throw updateError;
    }

    res.json({
      success: true,
      schedule: {
        id: subscriptionSchedule.id,
        status: subscriptionSchedule.status,
      },
      scheduledFor: new Date(subscription.current_period_end * 1000).toISOString(),
      scheduledChange,
      message: 'Subscription change scheduled for next billing cycle'
    });

  } catch (error: any) {
    console.error('❌ SCHEDULE: Error scheduling subscription update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to schedule subscription update'
    });
  }
});

// Sync subscription update immediately (for development)
router.post("/sync-subscription-update", async (req: Request, res: Response) => {
  try {
    const { subscriptionId, newPriceId, membershipId } = req.body;

    if (!subscriptionId || !newPriceId || !membershipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subscriptionId, newPriceId, membershipId'
      });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update Stripe subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Handle prorations automatically
    });

    // Update membership with new Stripe data
    await dbService.updateMembership(membershipId, {
      stripe_price_id: newPriceId,
      stripe_status: updatedSubscription.status,
      start_date: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });

    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_start: updatedSubscription.current_period_start,
        current_period_end: updatedSubscription.current_period_end
      },
      message: 'Subscription and membership updated successfully'
    });

  } catch (error: any) {
    console.error('❌ AUTO-SYNC: Error updating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to update subscription'
    });
  }
});

// Cancel scheduled subscription update
router.post("/cancel-scheduled-subscription-update", async (req: Request, res: Response) => {
  try {
    const { membershipId, scheduleId } = req.body;

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        error: 'Membership ID is required'
      });
    }

    // Cancel the Stripe subscription schedule if provided
    if (scheduleId) {
      try {
        await stripe.subscriptionSchedules.cancel(scheduleId);
      } catch (stripeError) {
        console.warn('⚠️ Failed to cancel Stripe subscription schedule:', stripeError);
        // Continue with database cleanup even if Stripe cancellation fails
      }
    }

    // Cancel the scheduled change in separate table
    const canceledChange = await dbService.cancelScheduledChange(membershipId, scheduleId);

    // Update membership status back to active
    const { data: membershipUpdate, error: updateError } = await supabase
      .from('memberships')
      .update({
        stripe_status: 'active', // Reset status
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update membership:', updateError);
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Scheduled change canceled successfully'
    });

  } catch (error: any) {
    console.error('❌ CANCEL: Error canceling scheduled subscription update:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to cancel scheduled subscription update'
    });
  }
});

// Get scheduled changes for a membership
router.get("/membership/:membershipId/scheduled-changes", async (req: Request, res: Response) => {
  try {
    const { membershipId } = req.params;

    if (!membershipId) {
      return res.status(400).json({
        success: false,
        error: 'Membership ID is required'
      });
    }

    const scheduledChange = await dbService.getActiveScheduledChange(membershipId);

    res.json({
      success: true,
      scheduledChange,
      hasScheduledChange: !!scheduledChange
    });

  } catch (error: any) {
    console.error('❌ Error getting scheduled changes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;