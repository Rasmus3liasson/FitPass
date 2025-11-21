import { Request, Response, Router } from "express";
import { dbService, supabase } from "../../services/database";
import { stripe, stripeService } from "../../services/stripe";

const router = Router();

// Manage subscription (legacy endpoint)
router.post("/manage-subscription", async (req: Request, res: Response) => {
  try {
    const { userId, stripePriceId } = req.body;

    if (!userId || !stripePriceId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, stripePriceId"
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
    const stripeCustomerId = await stripeService.createOrGetCustomer(
      "", // email will be fetched from profile
      "", // name will be fetched from profile
      userId
    );

    // Check for existing membership
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (existingMembership) {
      // User already has this plan
      if (existingMembership.plan_id === membershipPlan.id) {
        return res.json({
          success: true,
          message: "User already has this membership plan",
          membership: existingMembership
        });
      }

      // Update existing subscription
      if (existingMembership.stripe_subscription_id) {
        try {
          const subscription = await stripe.subscriptions.update(
            existingMembership.stripe_subscription_id,
            {
              items: [
                {
                  id: existingMembership.stripe_subscription_id,
                  price: stripePriceId,
                },
              ],
              proration_behavior: "create_prorations",
            }
          );

          // Update membership in database
          await dbService.updateMembership(existingMembership.id, {
            plan_id: membershipPlan.id,
            plan_type: membershipPlan.title,
            credits: membershipPlan.credits,
            credits_used: 0,
            stripe_price_id: stripePriceId,
            updated_at: new Date().toISOString()
          });

          return res.json({
            success: true,
            message: "Subscription updated successfully",
            subscription: {
              id: subscription.id,
              status: subscription.status,
            },
          });
        } catch (updateError) {
          // If update fails, cancel old subscription and create new one
          try {
            await stripe.subscriptions.cancel(existingMembership.stripe_subscription_id);
          } catch (cancelError) {
            console.warn("Failed to cancel old subscription:", cancelError);
          }
        }
      }

      // Deactivate old membership
      await dbService.deactivateUserMemberships(userId);
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    // Create new membership
    const membership = await dbService.createMembership({
      user_id: userId,
      plan_id: membershipPlan.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      credits_used: 0,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: stripePriceId,
      stripe_status: subscription.status,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      is_active: true,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      },
      membership,
    });
  } catch (error: any) {
    console.error("Error managing subscription:", error);
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

    // Get user profile to create customer
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, stripe_customer_id")
      .eq("id", userId)
      .single();

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
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
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

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: "keep_as_draft",
      },
    });

    res.json({ success: true, subscription });
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
    const { data: membership } = await supabase
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
    console.error("Error getting user subscription:", error);
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

export default router;