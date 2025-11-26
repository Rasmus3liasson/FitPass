import { Request, Response, Router } from "express";
import { dbService, supabase } from "../../services/database";
import { stripe, stripeService } from "../../services/stripe";

const router = Router();

// Manage subscription (legacy endpoint)
router.post("/manage-subscription", async (req: Request, res: Response) => {
  try {
    const { userId, stripePriceId } = req.body;

    console.log('🚀 ==> MANAGE SUBSCRIPTION DEBUG START <==');
    console.log('📋 Request Data:', {
      userId: userId?.slice(0, 8) + '...',
      stripePriceId: stripePriceId,
      timestamp: new Date().toISOString()
    });

    if (!userId || !stripePriceId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, stripePriceId"
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
        .single()
    ]);

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
      });
    }

    // Get membership plan
    const { data: membershipPlan, error: planError } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("stripe_price_id", stripePriceId)
      .single();

    if (planError || !membershipPlan) {
      return res.status(404).json({
        success: false,
        error: "Membership plan not found"
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
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    // Check environment for production mode handling (prioritize EXPO_PUBLIC_ENVIRONMENT)
    const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

    console.log('🌍 Environment Detection:', {
      EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT,
      NODE_ENV: process.env.NODE_ENV,
      isProduction: isProduction
    });

    // Get current membership status BEFORE making changes
    const { data: currentMembership } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    console.log('📊 Current Membership Status:', {
      exists: !!currentMembership,
      planType: currentMembership?.plan_type,
      stripeSubId: currentMembership?.stripe_subscription_id,
      stripeStatus: currentMembership?.stripe_status,
      isActive: currentMembership?.is_active
    });

    // If user has Stripe subscription, check its actual status
    if (currentMembership?.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(currentMembership.stripe_subscription_id);
        console.log('💳 Stripe Subscription Details:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          items: stripeSubscription.items.data.map(item => ({
            price_id: item.price.id,
            product: item.price.product
          }))
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
      is_production: isProduction
    });

    console.log('📝 Membership Update Result:', {
      membershipId: membership.id,
      planType: membership.plan_type,
      requiresScheduling: membership.requiresScheduling,
      stripeStatus: membership.stripe_status,
      stripeSubId: membership.stripe_subscription_id
    });

    // Check if scheduling is required (production mode with active subscription)
    if (membership.requiresScheduling) {
      console.log('📅 SCHEDULING PATH ACTIVATED');
      // Handle production mode - create scheduled change
      try {
        // First check if there's already a scheduled change for this membership
        const existingScheduledChange = await dbService.getActiveScheduledChange(membership.id);
        
        if (existingScheduledChange) {
          // Return existing scheduled change info
          const changeDate = new Date(existingScheduledChange.scheduled_change_date);
          return res.json({
            success: true,
            message: "Plan change already scheduled for next billing cycle",
            membership: {
              ...membership,
              scheduledChange: {
                id: existingScheduledChange.id,
                planId: existingScheduledChange.scheduled_plan_id,
                planTitle: existingScheduledChange.scheduled_plan_title,
                planCredits: existingScheduledChange.scheduled_plan_credits,
                nextBillingDate: existingScheduledChange.scheduled_change_date,
                nextBillingDateFormatted: changeDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                }),
                confirmed: existingScheduledChange.status === 'confirmed',
                scheduleId: existingScheduledChange.stripe_schedule_id
              }
            },
            scheduled: true,
            alreadyScheduled: true
          });
        }
        
        // Get current subscription details
        const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
        
        // Create scheduled change in database
        const scheduledChange = await dbService.createScheduledChange({
          membershipId: membership.id,
          scheduledPlanId: membership.newPlanId,
          scheduledPlanTitle: membership.newPlanTitle,
          scheduledPlanCredits: membership.newPlanCredits,
          scheduledStripePriceId: membership.newStripePriceId,
          scheduledChangeDate: new Date(subscription.current_period_end * 1000).toISOString(),
          stripeScheduleId: '', // Will be updated when Stripe schedule is created
          status: 'pending'
        });

        // Create Stripe subscription schedule for next billing cycle
        const scheduleParams = {
          customer: stripeCustomerId,
          start_date: subscription.current_period_end,
          end_behavior: 'release' as const,
          phases: [
            {
              items: [
                {
                  price: membership.newStripePriceId,
                  quantity: 1,
                },
              ],
              iterations: 1,
            },
          ],
        };

        const subscriptionSchedule = await stripe.subscriptionSchedules.create(scheduleParams);

        // Update scheduled change with Stripe schedule ID
        await dbService.updateScheduledChange(scheduledChange.id, {
          stripe_schedule_id: subscriptionSchedule.id,
          status: 'confirmed'
        });

        // Update membership status to indicate scheduled change
        await dbService.updateMembership(membership.id, {
          stripe_status: 'scheduled_change',
          next_cycle_date: new Date(subscription.current_period_end * 1000).toISOString()
        });

        const nextBillingDate = new Date(subscription.current_period_end * 1000);
        return res.json({
          success: true,
          message: "Plan change scheduled for next billing cycle",
          membership: {
            ...membership,
            scheduledChange: {
              id: scheduledChange.id,
              planId: membership.newPlanId,
              planTitle: membership.newPlanTitle,
              planCredits: membership.newPlanCredits,
              nextBillingDate: nextBillingDate.toISOString(),
              nextBillingDateFormatted: nextBillingDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              confirmed: true,
              scheduleId: subscriptionSchedule.id
            }
          },
          scheduled: true
        });
      } catch (scheduleError: any) {
        console.error('Error creating scheduled change:', scheduleError);
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
      scheduled: false
    });
    console.log('🏁 ==> MANAGE SUBSCRIPTION DEBUG END (SUCCESS) <==\n');
    
    return res.json({
      success: true,
      message: "Membership updated successfully",
      membership,
      scheduled: false
    });

  } catch (error: any) {
    console.error("❌ Error managing subscription:", error);
    console.log('🏁 ==> MANAGE SUBSCRIPTION DEBUG END (ERROR) <==\n');
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create subscription
router.post("/create-subscription", async (req: Request, res: Response) => {
  try {
    const { userId, priceId, membershipId } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, priceId"
      });
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

    const [userEmailForCreate, { data: profile, error: profileError }] = await Promise.all([
      getUserEmailForSub(userId),
      supabase
        .from("profiles")
        .select("first_name, last_name, stripe_customer_id")
        .eq("id", userId)
        .single()
    ]);

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: "User profile not found"
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
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        user_id: userId,
        membership_id: membershipId || "",
      },
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        customer_id: customerId,
      },
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cancel subscription
router.post("/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
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
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Pause subscription
router.post("/pause-subscription", async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    // Pause subscription - this prevents billing
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: "void", // Don't create invoices during pause
      },
    });

    res.json({ 
      success: true, 
      subscription,
      message: "Subscription paused. No invoices will be created during the pause period."
    });
  } catch (error: any) {
    console.error("Error pausing subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Resume subscription
router.post("/resume-subscription", async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });

    res.json({ success: true, subscription });
  } catch (error: any) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription
router.get("/user/:userId/subscription", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's active membership with subscription details
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans:plan_id (*)
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.json({
        success: true,
        subscription: null,
        message: "No active subscription found"
      });
    }

    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      membership.stripe_subscription_id,
      {
        expand: ['items.data.price']
      }
    );

    // Format subscription data
    const subscription = {
      id: stripeSubscription.id,
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null,
      pause_collection: stripeSubscription.pause_collection || null,
      plan_name: membership.membership_plans?.title || 'Unknown Plan',
      amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
      currency: stripeSubscription.items.data[0]?.price.currency || 'sek',
      interval: stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
      next_billing_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    };

    res.json({
      success: true,
      subscription
    });

  } catch (error: any) {
    console.error("❌ Error getting user subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel user subscription at period end
router.post("/user/:userId/subscription/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || 'User requested cancellation',
        }
      }
    );

    res.json({
      success: true,
      message: "Subscription will be canceled at the end of your current billing period",
      subscription: {
        id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    });

  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pause user subscription
router.post("/user/:userId/subscription/pause", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Pause subscription - no billing during pause
    const subscription = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      {
        pause_collection: {
          behavior: "void", // Don't create invoices during pause period
        },
        metadata: {
          pause_reason: reason || 'User requested pause',
        }
      }
    );

    res.json({
      success: true,
      message: "Subscription paused. You will not be charged during the pause period.",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        pause_collection: subscription.pause_collection
      }
    });

  } catch (error: any) {
    console.error("Error pausing subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resume paused subscription
router.post("/user/:userId/subscription/resume", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Resume subscription - billing will continue
    const subscription = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      {
        pause_collection: null,
      }
    );

    res.json({
      success: true,
      message: "Subscription resumed. Billing will continue.",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        pause_collection: subscription.pause_collection
      }
    });

  } catch (error: any) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reactivate canceled subscription
router.post("/user/:userId/subscription/reactivate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's active membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership || !membership.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(
      membership.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    res.json({
      success: true,
      message: "Subscription has been reactivated",
      subscription: {
        id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status
      }
    });

  } catch (error: any) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scheduled changes for a user
router.get("/scheduled-changes/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId parameter"
      });
    }

    // Get user's active membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({
        success: false,
        error: "No active membership found"
      });
    }

    // Get scheduled changes for this membership
    const scheduledChange = await dbService.getActiveScheduledChange(membership.id);

    if (!scheduledChange) {
      return res.json({
        success: true,
        hasScheduledChange: false,
        membership: membership
      });
    }

    const changeDate = new Date(scheduledChange.scheduled_change_date);
    return res.json({
      success: true,
      hasScheduledChange: true,
      membership: membership,
      scheduledChange: {
        id: scheduledChange.id,
        planId: scheduledChange.scheduled_plan_id,
        planTitle: scheduledChange.scheduled_plan_title,
        planCredits: scheduledChange.scheduled_plan_credits,
        nextBillingDate: scheduledChange.scheduled_change_date,
        nextBillingDateFormatted: changeDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: scheduledChange.status,
        confirmed: scheduledChange.status === 'confirmed',
        scheduleId: scheduledChange.stripe_schedule_id
      }
    });
  } catch (error: any) {
    console.error('Error getting scheduled changes:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to get scheduled changes"
    });
  }
});

// Update subscription endpoint
router.post("/update", async (req: Request, res: Response) => {
  try {
    const userId = req.headers.authorization?.replace('Bearer ', '');
    const { priceId, subscriptionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Missing authorization"
      });
    }

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: "Missing priceId"
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
        error: "User profile not found"
      });
    }

    // Get current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: userProfile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
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
          error: "Invalid price ID"
        });
      }

      // Get current membership to check for existing scheduled changes
      const { data: currentMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (currentMembership) {
        // Check for existing scheduled changes
        const { data: existingScheduledChange } = await supabase
          .from('membership_scheduled_changes')
          .select('*')
          .eq('membership_id', currentMembership.id)
          .in('status', ['pending', 'confirmed'])
          .maybeSingle();

        // If there's an existing scheduled change, cancel it first
        if (existingScheduledChange) {
          console.log('🔄 Canceling existing scheduled change before creating new one');
          
          try {
            // Cancel the existing Stripe schedule if it exists
            if (existingScheduledChange.stripe_schedule_id) {
              await stripe.subscriptionSchedules.cancel(existingScheduledChange.stripe_schedule_id);
            }
            
            // Mark as canceled in database and wait for completion
            const { error: cancelError } = await supabase
              .from('membership_scheduled_changes')
              .update({ status: 'canceled' })
              .eq('id', existingScheduledChange.id);

            if (cancelError) {
              console.error('❌ Failed to cancel existing scheduled change in database:', cancelError);
              return res.status(500).json({
                success: false,
                error: "Failed to cancel existing scheduled change"
              });
            }

            console.log('✅ Successfully canceled existing scheduled change');

          } catch (cancelError) {
            console.error('❌ Failed to cancel existing scheduled change:', cancelError);
            return res.status(500).json({
              success: false,
              error: "Failed to cancel existing scheduled change"
            });
          }
        }
      }
      
      const result = await dbService.createOrUpdateMembership({
        user_id: userId,
        plan_id: planDetails.id,
        plan_type: planDetails.title,
        credits: planDetails.credits,
        stripe_customer_id: userProfile.stripe_customer_id,
        stripe_subscription_id: currentSubscription.id,
        stripe_price_id: priceId,
        stripe_status: 'active', // Keep as active since current subscription is still active
        is_production: true
      });

      console.log('🔬 DEBUG: Database operation result:', result);

      return res.json({
        success: true,
        message: "Subscription update scheduled for next billing cycle",
        scheduledForNextBilling: true,
        nextBillingDate: new Date(currentSubscription.current_period_end * 1000).toISOString()
      });
    } else {
      // In development, update immediately
      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.id,
        {
          items: [
            {
              id: currentSubscription.items.data[0].id,
              price: priceId,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Update database
      const devPlanDetails = await dbService.getMembershipPlanByStripePrice(priceId);
      
      if (!devPlanDetails) {
        return res.status(400).json({
          success: false,
          error: "Invalid price ID"
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
        is_production: false
      });

      return res.json({
        success: true,
        message: "Subscription updated immediately",
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status
        }
      });
    }

  } catch (error: any) {
    console.error('Error in subscription update:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to update subscription",
      details: error.message
    });
  }
});

export default router;