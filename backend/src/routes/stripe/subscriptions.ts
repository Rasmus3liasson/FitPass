import { Request, Response, Router } from 'express';
import { dbService, supabase } from '../../services/database';
import { stripe, stripeService } from '../../services/stripe';

const router: Router = Router() as Router;

// Get user's current subscription from Stripe (real-time data)
router.get('/user/:userId/subscription', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return res.json({
        success: true,
        subscription: null,
        membership: null,
      });
    }

    // Get active subscriptions from Stripe
    // Note: Stripe only allows 4 levels of expansion, so we can't expand items.data.price.product
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 1,
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        success: true,
        subscription: null,
        membership: null,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;

    // Check if there's a scheduled subscription change (subscription schedule)
    let scheduledChange = null;
    try {
      const schedules = await stripe.subscriptionSchedules.list({
        customer: profile.stripe_customer_id,
        limit: 1,
      });

      if (schedules.data.length > 0) {
        const schedule = schedules.data[0];

        // Check if schedule is active and has multiple phases (indicating a plan change)
        if (schedule.status === 'active' && schedule.phases.length > 1) {
          const currentPhase = schedule.phases[0];
          const nextPhase = schedule.phases[1];

          const currentPriceId = currentPhase.items[0]?.price;
          const nextPriceId = nextPhase.items[0]?.price;

          // If prices are different, there's a scheduled change
          if (currentPriceId !== nextPriceId) {
            // Get the new plan details
            const { data: nextPlan } = await supabase
              .from('membership_plans')
              .select('*')
              .eq('stripe_price_id', nextPriceId)
              .single();

            if (nextPlan) {
              scheduledChange = {
                schedule_id: schedule.id,
                new_plan_id: nextPlan.id,
                new_plan_title: nextPlan.title,
                new_price_id: nextPriceId,
                effective_date: new Date(nextPhase.start_date * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              };
            }
          }
        }
      }
    } catch (scheduleError) {
      console.error('Error checking subscription schedules:', scheduleError);
      // Continue without scheduled change info if there's an error
    }

    // Format subscription with ISO date strings for frontend consumption
    const formattedSubscription = {
      ...subscription,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created: new Date(subscription.created * 1000).toISOString(),
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      pause_collection: subscription.pause_collection
        ? {
            ...subscription.pause_collection,
            resumes_at: subscription.pause_collection.resumes_at
              ? new Date(subscription.pause_collection.resumes_at * 1000).toISOString()
              : null,
          }
        : null,
    };

    // Get plan details from database
    const { data: plan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    // Get active bookings count
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    // Get membership from DB for credits_used
    const { data: dbMembership } = await supabase
      .from('memberships')
      .select('credits_used')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    // Construct membership object from Stripe data
    const membership = plan
      ? {
          id: subscription.id,
          user_id: userId,
          plan_id: plan.id,
          plan_type: plan.title,
          credits: plan.credits,
          credits_used: dbMembership?.credits_used || 0,
          is_active: subscription.status === 'active' || subscription.status === 'trialing',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_status: subscription.status,
          stripe_price_id: priceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          active_bookings: activeBookings || 0,
          created_at: new Date(subscription.created * 1000).toISOString(),
          membership_plans: plan,
          scheduledChange: scheduledChange
            ? {
                planId: scheduledChange.new_plan_id,
                planTitle: scheduledChange.new_plan_title,
                nextBillingDate: scheduledChange.effective_date,
                scheduleId: scheduledChange.schedule_id,
                confirmed: true,
                scheduled: true,
              }
            : undefined,
        }
      : null;

    res.json({
      success: true,
      subscription: formattedSubscription,
      membership: membership,
      scheduledChange: scheduledChange, // Also return at top level for easier access
    });
  } catch (error: any) {
    console.error('Error fetching subscription from Stripe:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manage subscription (legacy endpoint)
router.post('/manage-subscription', async (req: Request, res: Response) => {
  try {
    const { userId, stripePriceId } = req.body;

    console.log('🚀 ==> MANAGE SUBSCRIPTION DEBUG START <==');
    console.log('📋 Request Data:', {
      userId: userId?.slice(0, 8) + '...',
      stripePriceId: stripePriceId,
      timestamp: new Date().toISOString(),
    });

    if (!userId || !stripePriceId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, stripePriceId',
      });
    }

    // Get user email and profile
    const getUserEmail = async (userId: string): Promise<string> => {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        return authUser.user?.email || `user-${userId.slice(0, 8)}@fitpass.app`;
      } catch {
        return `user-${userId.slice(0, 8)}@fitpass.app`;
      }
    };

    const [userEmail, { data: userProfile, error: profileError }] = await Promise.all([
      getUserEmail(userId),
      supabase
        .from('profiles')
        .select('first_name, last_name, stripe_customer_id')
        .eq('id', userId)
        .single(),
    ]);

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    // Get membership plan
    const { data: membershipPlan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('stripe_price_id', stripePriceId)
      .single();

    if (planError || !membershipPlan) {
      return res.status(404).json({
        success: false,
        error: 'Membership plan not found',
      });
    }

    // Get or create Stripe customer
    const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    const stripeCustomerId = await stripeService.createOrGetCustomer(
      userEmail,
      fullName || 'Unknown User',
      userId
    );

    // Check for existing membership
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    // Check environment for production mode handling (prioritize EXPO_PUBLIC_ENVIRONMENT)
    const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

    console.log('🌍 Environment Detection:', {
      EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      isProduction: isProduction,
    });

    // Get current membership status BEFORE making changes
    const { data: currentMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('📊 Current Membership Status:', {
      exists: !!currentMembership,
      planType: currentMembership?.plan_type,
      stripeSubId: currentMembership?.stripe_subscription_id,
      stripeStatus: currentMembership?.stripe_status,
      isActive: currentMembership?.is_active,
    });

    // If user has Stripe subscription, check its actual status
    if (currentMembership?.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          currentMembership.stripe_subscription_id
        );
        console.log('💳 Stripe Subscription Details:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          items: stripeSubscription.items.data.map((item) => ({
            price_id: item.price.id,
            product: item.price.product,
          })),
        });
      } catch (stripeError: any) {
        console.log('❌ Stripe API Error:', stripeError.message);
      }
    }

    // Try to create or update membership with proper duplicate prevention
    let membership;
    let subscription;

    membership = await dbService.createOrUpdateMembership({
      user_id: userId,
      plan_id: membershipPlan.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      stripe_customer_id: stripeCustomerId,
      stripe_price_id: stripePriceId,
      is_production: isProduction,
    });

    console.log('📝 Membership Update Result:', {
      membershipId: membership.id,
      planType: membership.plan_type,
      requiresScheduling: membership.requiresScheduling,
      stripeStatus: membership.stripe_status,
      stripeSubId: membership.stripe_subscription_id,
    });

    // Check if scheduling is required (production mode with active subscription)
    if (membership.requiresScheduling) {
      console.log('📅 SCHEDULING PATH ACTIVATED - Using Stripe-native scheduling');
      try {
        // Get current subscription details
        const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);

        // Update subscription with proration_behavior='none' to schedule change for next billing cycle
        // Stripe will automatically apply the change at period end
        await stripe.subscriptions.update(membership.stripe_subscription_id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: membership.newStripePriceId,
            },
          ],
          proration_behavior: 'none', // Changes apply at next billing cycle
        });

        const nextBillingDate = new Date(subscription.current_period_end * 1000);
        return res.json({
          success: true,
          message: 'Plan change scheduled for next billing cycle',
          membership: {
            ...membership,
            nextBillingDate: nextBillingDate.toISOString(),
            nextBillingDateFormatted: nextBillingDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          },
          scheduled: true,
        });
      } catch (scheduleError: any) {
        console.error('Error scheduling plan change:', scheduleError);
        throw new Error(`Failed to schedule plan change: ${scheduleError.message}`);
      }
    }

    // Development mode or immediate update - return updated membership
    console.log('✅ IMMEDIATE UPDATE COMPLETED');
    console.log('📤 Final Response:', {
      success: true,
      membershipId: membership.id,
      planType: membership.plan_type,
      stripeStatus: membership.stripe_status,
      scheduled: false,
    });
    console.log('🏁 ==> MANAGE SUBSCRIPTION DEBUG END (SUCCESS) <==\n');

    return res.json({
      success: true,
      message: 'Membership updated successfully',
      membership,
      scheduled: false,
    });
  } catch (error: any) {
    console.error('❌ Error managing subscription:', error);
    console.log('🏁 ==> MANAGE SUBSCRIPTION DEBUG END (ERROR) <==\n');
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create subscription
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { userId, priceId, membershipId } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, priceId',
      });
    }

    // Get user's Stripe customer ID and profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    // ALWAYS check Stripe first (source of truth)
    // Database may be out of sync if webhooks haven't processed yet
    let existingSubscription = null;

    if (userProfile?.stripe_customer_id) {
      try {
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: userProfile.stripe_customer_id,
          status: 'active',
          limit: 1,
        });

        if (stripeSubscriptions.data.length > 0) {
          const stripeSub = stripeSubscriptions.data[0];
          existingSubscription = {
            id: null,
            stripe_subscription_id: stripeSub.id,
            plan_id: null,
            stripe_price_id: stripeSub.items.data[0]?.price?.id,
            user_id: userId,
          };
        }
      } catch (stripeError) {
        console.error('Error checking Stripe subscriptions:', stripeError);
      }
    }

    // If user already has an active subscription, update/schedule instead of creating new
    if (existingSubscription) {
      const existing = existingSubscription;

      // Check if user is trying to select the same plan
      if (existing.stripe_price_id === priceId) {
        return res.json({
          success: true,
          message: 'You are already subscribed to this plan',
          alreadySubscribed: true,
        });
      }

      try {
        // Get the new plan details
        const { data: newPlan } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('stripe_price_id', priceId)
          .single();

        if (!newPlan) {
          return res.status(400).json({
            success: false,
            error: 'Invalid plan selected',
          });
        }

        // Get the current subscription
        const subscription = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
        const scheduledDate = new Date(subscription.current_period_end * 1000);

        // Use Stripe Subscription Schedules API to properly schedule change at period end
        // This creates a schedule that will update the subscription at the next billing cycle
        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: existing.stripe_subscription_id,
        });

        // Update the schedule to change the plan at the current period end
        const updatedSchedule = await stripe.subscriptionSchedules.update(schedule.id, {
          phases: [
            {
              // Current phase - keep existing plan until period end
              items: [
                {
                  price: subscription.items.data[0].price.id,
                  quantity: 1,
                },
              ],
              start_date: subscription.current_period_start,
              end_date: subscription.current_period_end,
            },
            {
              // Next phase - switch to new plan
              items: [
                {
                  price: priceId,
                  quantity: 1,
                },
              ],
              start_date: subscription.current_period_end,
            },
          ],
          end_behavior: 'release', // Release subscription back to normal billing after schedule completes
        });

        return res.json({
          success: true,
          scheduled: true,
          message: 'Subscription change scheduled for next billing period',
          scheduledChange: {
            subscription_id: existing.stripe_subscription_id,
            schedule_id: updatedSchedule.id,
            current_plan: existing.plan_id,
            new_plan: newPlan.id,
            new_plan_title: newPlan.title,
            effective_date: scheduledDate.toISOString(),
          },
          // Don't set pending flag for scheduled changes - they're not new subscriptions
          pending: false,
          subscription: {
            id: existing.stripe_subscription_id,
            status: subscription.status,
          },
        });
      } catch (scheduleError: any) {
        console.error('❌ Error creating scheduled change:', scheduleError);
        return res.status(500).json({
          success: false,
          error: `Failed to schedule subscription change: ${scheduleError.message}`,
        });
      }
    }

    // Get user email and profile
    const getUserEmailForSub = async (userId: string): Promise<string> => {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        return authUser.user?.email || `user-${userId.slice(0, 8)}@fitpass.app`;
      } catch {
        return `user-${userId.slice(0, 8)}@fitpass.app`;
      }
    };

    const [userEmailForCreate, { data: profile, error: profileError2 }] = await Promise.all([
      getUserEmailForSub(userId),
      supabase
        .from('profiles')
        .select('first_name, last_name, stripe_customer_id')
        .eq('id', userId)
        .single(),
    ]);

    if (profileError2 || !profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    let customerId = profile.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmailForCreate,
        name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User',
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to profile
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    // Check if customer has payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const hasPaymentMethod = paymentMethods.data.length > 0;
    const defaultPaymentMethodId = hasPaymentMethod ? paymentMethods.data[0].id : undefined;

    // Create subscription in Stripe
    // DO NOT update database here - let webhook handle it

    const subscriptionParams: any = {
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
        membership_id: membershipId || '',
      },
    };

    // If payment method exists, use it and charge immediately
    if (hasPaymentMethod && defaultPaymentMethodId) {
      subscriptionParams.default_payment_method = defaultPaymentMethodId;
      subscriptionParams.payment_behavior = 'error_if_incomplete';
    } else {
      // No payment method - create incomplete subscription that requires setup
      subscriptionParams.payment_behavior = 'default_incomplete';
      subscriptionParams.payment_settings = { save_default_payment_method: 'on_subscription' };
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Return pending status - webhook will sync to database
    res.json({
      success: true,
      pending: true,
      message: 'Subscription created in Stripe. Database will sync via webhook.',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        customer_id: customerId,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manual sync endpoint - force sync subscription from Stripe to database
router.post('/sync-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required',
      });
    }

    // Validate subscription ID format
    if (!subscriptionId.startsWith('sub_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription ID format',
      });
    }

    // Fetch subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Trigger sync
    await stripeService.syncSubscription(subscription);

    // Fetch updated membership
    const membership = await dbService.getMembershipBySubscriptionId(subscriptionId);

    res.json({
      success: true,
      message: 'Subscription synced successfully',
      membership,
    });
  } catch (error: any) {
    console.error('❌ Error syncing subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause subscription
router.post('/pause-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    // Pause subscription - this prevents billing
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void', // Don't create invoices during pause
      },
    });

    res.json({
      success: true,
      subscription,
      message: 'Subscription paused. No invoices will be created during the pause period.',
    });
  } catch (error: any) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume subscription
router.post('/resume-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });

    res.json({ success: true, subscription });
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription
router.get('/user/:userId/subscription', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's active membership with subscription details
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select(
        `
        *,
        membership_plans:plan_id (*)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found',
      });
    }

    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      membership.stripe_subscription_id,
      {
        expand: ['items.data.price'],
      }
    );

    // Format subscription data
    const subscription = {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
        : null,
      pause_collection: stripeSubscription.pause_collection || null,
      plan_name: membership.membership_plans?.title || 'Unknown Plan',
      amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
      currency: stripeSubscription.items.data[0]?.price.currency || 'sek',
      interval: stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
      next_billing_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    };

    res.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error('❌ Error getting user subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cancel user subscription at period end
router.post('/user/:userId/subscription/cancel', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);

    if (subscription.schedule) {
      const schedule = await stripe.subscriptionSchedules.retrieve(subscription.schedule as string);

      if (schedule.status === 'active') {
        await stripe.subscriptionSchedules.release(schedule.id);
      }
    }

    const updatedSubscription = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || 'User requested cancellation',
        },
      }
    );

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of your current billing period',
      subscription: {
        id: updatedSubscription.id,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: updatedSubscription.current_period_end,
      },
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Pause user subscription
router.post('/user/:userId/subscription/pause', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    // Pause subscription - no billing during pause
    const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
      pause_collection: {
        behavior: 'void', // Don't create invoices during pause period
      },
      metadata: {
        pause_reason: reason || 'User requested pause',
      },
    });

    res.json({
      success: true,
      message: 'Subscription paused. You will not be charged during the pause period.',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        pause_collection: subscription.pause_collection,
      },
    });
  } catch (error: any) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Resume paused subscription
router.post('/user/:userId/subscription/resume', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    // Resume subscription - billing will continue
    const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
      pause_collection: null,
    });

    res.json({
      success: true,
      message: 'Subscription resumed. Billing will continue.',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        pause_collection: subscription.pause_collection,
      },
    });
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Reactivate canceled subscription
router.post('/user/:userId/subscription/reactivate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    res.json({
      success: true,
      message: 'Subscription has been reactivated',
      subscription: {
        id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get scheduled changes for a user
router.get('/scheduled-changes/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId parameter',
      });
    }

    // Get user's active membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({
        success: false,
        error: 'No active membership found',
      });
    }

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.json({
        success: true,
        hasScheduledChange: false,
        membership: membership,
        scheduledChange: null,
      });
    }

    // Check for active subscription schedules (Stripe-native scheduling)
    let scheduledChange = null;
    try {
      const schedules = await stripe.subscriptionSchedules.list({
        customer: profile.stripe_customer_id,
        limit: 1,
      });

      if (schedules.data.length > 0) {
        const schedule = schedules.data[0];

        // Check if schedule is active and has multiple phases (indicating a plan change)
        if (schedule.status === 'active' && schedule.phases.length > 1) {
          const currentPhase = schedule.phases[0];
          const nextPhase = schedule.phases[1];

          const currentPriceId = currentPhase.items[0]?.price;
          const nextPriceId = nextPhase.items[0]?.price;

          // If prices are different, there's a scheduled change
          if (currentPriceId !== nextPriceId) {
            // Get the new plan details
            const { data: nextPlan } = await supabase
              .from('membership_plans')
              .select('*')
              .eq('stripe_price_id', nextPriceId)
              .single();

            if (nextPlan) {
              scheduledChange = {
                planId: nextPlan.id,
                planTitle: nextPlan.title,
                planCredits: nextPlan.credits,
                nextBillingDate: new Date(nextPhase.start_date * 1000).toISOString(),
                scheduleId: schedule.id,
                status: 'confirmed',
                confirmed: true,
                scheduled: true,
              };
            }
          }
        }
      }
    } catch (scheduleError) {
      console.error('Error checking subscription schedules:', scheduleError);
    }

    return res.json({
      success: true,
      hasScheduledChange: !!scheduledChange,
      membership: membership,
      scheduledChange: scheduledChange,
    });
  } catch (error: any) {
    console.error('Error getting scheduled changes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get scheduled changes',
    });
  }
});

// Update subscription endpoint
router.post('/update', async (req: Request, res: Response) => {
  try {
    const userId = req.headers.authorization?.replace('Bearer ', '');
    const { priceId, subscriptionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Missing authorization',
      });
    }

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing priceId',
      });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: userProfile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found',
      });
    }

    const currentSubscription = subscriptions.data[0];

    // Check environment and decide how to handle the update
    const environment = process.env.NODE_ENV || process.env.EXPO_PUBLIC_ENVIRONMENT;

    if (environment === 'production') {
      // In production, schedule the change for next billing cycle
      // Keep current subscription active while scheduling the change

      // First get the plan details for the new price
      const planDetails = await dbService.getMembershipPlanByStripePrice(priceId);

      if (!planDetails) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price ID',
        });
      }

      // Get current membership to check for existing scheduled changes
      const { data: currentMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      // Simply update the subscription in Stripe - it handles scheduling automatically
      // No need to track scheduled changes in a separate table
      const result = await dbService.createOrUpdateMembership({
        user_id: userId,
        plan_id: planDetails.id,
        plan_type: planDetails.title,
        credits: planDetails.credits,
        stripe_customer_id: userProfile.stripe_customer_id,
        stripe_subscription_id: currentSubscription.id,
        stripe_price_id: priceId,
        stripe_status: 'active', // Keep as active since current subscription is still active
        is_production: true,
      });

      console.log('🔬 DEBUG: Database operation result:', result);

      return res.json({
        success: true,
        message: 'Subscription update scheduled for next billing cycle',
        scheduledForNextBilling: true,
        nextBillingDate: new Date(currentSubscription.current_period_end * 1000).toISOString(),
      });
    } else {
      // In development, update immediately
      const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
        items: [
          {
            id: currentSubscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });

      // Update database
      const devPlanDetails = await dbService.getMembershipPlanByStripePrice(priceId);

      if (!devPlanDetails) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price ID',
        });
      }

      const result = await dbService.createOrUpdateMembership({
        user_id: userId,
        plan_id: devPlanDetails.id,
        plan_type: devPlanDetails.title,
        credits: devPlanDetails.credits,
        stripe_customer_id: userProfile.stripe_customer_id,
        stripe_subscription_id: updatedSubscription.id,
        stripe_price_id: priceId,
        stripe_status: updatedSubscription.status,
        is_production: false,
      });

      return res.json({
        success: true,
        message: 'Subscription updated immediately',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
        },
      });
    }
  } catch (error: any) {
    console.error('Error in subscription update:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update subscription',
      details: error.message,
    });
  }
});

export default router;
