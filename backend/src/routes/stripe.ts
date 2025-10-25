import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { dbService, supabase } from "../services/database";
import { stripe, stripeService } from "../services/stripe";

const router = Router();

// 🔒 SECURITY: Middleware to sanitize logs and prevent sensitive data exposure
const securityMiddleware = (req: Request, res: Response, next: any) => {
  // Override console.log for this request to filter sensitive data
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  const sanitizeLogData = (data: any): any => {
    if (typeof data === "string") {
      // Remove potential card numbers, CVCs, or sensitive patterns
      return data
        .replace(/\b\d{13,19}\b/g, "****CARD_NUMBER_REDACTED****")
        .replace(/\b\d{3,4}\b/g, (match) => {
          // Only redact if it looks like a CVC (3-4 digits)
          return match.length <= 4 ? "***" : match;
        });
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };

      // List of sensitive fields to redact
      const sensitiveFields = [
        "card_number",
        "number",
        "cvc",
        "cvv",
        "cvv2",
        "exp_month",
        "exp_year",
        "client_secret",
        "secret",
        "password",
        "token",
        "key",
      ];

      Object.keys(sanitized).forEach((key) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          sanitized[key] = "****REDACTED****";
        } else if (typeof sanitized[key] === "object") {
          sanitized[key] = sanitizeLogData(sanitized[key]);
        }
      });

      return sanitized;
    }

    return data;
  };

  console.log = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleLog.apply(console, sanitizedArgs);
  };

  console.error = (...args: any[]) => {
    const sanitizedArgs = args.map(sanitizeLogData);
    originalConsoleError.apply(console, sanitizedArgs);
  };

  // Restore original console methods after request
  res.on("finish", () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  next();
};

// Apply security middleware to all routes
router.use(securityMiddleware);

// Debug route to test if routes are working
router.get("/test", (req: Request, res: Response) => {
  res.json({
    message: "Stripe routes are working!",
    timestamp: new Date().toISOString(),
  });
});

// Create Stripe customer - Keep for StripeService compatibility
router.post("/create-customer", async (req: Request, res: Response) => {
  try {
    const { email, name, userId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" });
    }

    const customerId = await stripeService.createOrGetCustomer(
      email,
      name,
      userId
    );

    res.json({ customerId });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get or create Stripe customer ID for user
router.post("/get-customer-id", async (req: Request, res: Response) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // First check if user already has a stripe_customer_id in membership
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("stripe_customer_id, user_id")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("🔍 Memberships table check:", { data: membership, error: membershipError });

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("❌ Error fetching membership:", membershipError);
      return res.status(500).json({ error: "Database error" });
    }

    if (membership?.stripe_customer_id) {
      console.log(
        "✅ Found existing customer ID:",
        membership.stripe_customer_id
      );
      return res.json({
        success: true,
        customerId: membership.stripe_customer_id,
      });
    }

    // If no customer ID exists and no email/name provided, we can't create customer
    if (!email) {
      return res
        .status(400)
        .json({ error: "Email is required to create customer" });
    }

    // Get user profile for additional data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, display_name")
      .eq("id", userId)
      .single();

    // Create Stripe customer
    const fullName =
      name ||
      profile?.display_name ||
      `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
      email;

    const customerId = await stripeService.createOrGetCustomer(
      email,
      fullName,
      userId
    );

    console.log("✅ Created new customer ID:", customerId);
    res.json({
      success: true,
      customerId,
    });
  } catch (error: any) {
    console.error("❌ Error getting customer ID:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create Setup Intent for Payment Sheet (saving payment methods)
router.post("/create-setup-intent", async (req: Request, res: Response) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "User ID and email are required" });
    }

    // 🔒 SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }


    // 1. Try to get stripe_customer_id from profiles table
    let customerId: string | null = null;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Error fetching profile for setup intent:', profileError);
    }

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
      console.log('✅ Using existing stripe_customer_id from profile:', customerId);
    } else {
      // 2. Create or get customer from Stripe
      customerId = await stripeService.createOrGetCustomer(
        email,
        name || email,
        userId
      );
      // 3. Save new customerId to profile if not already set
      if (customerId) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
        if (updateError) {
          console.error('❌ Error updating profile with new stripe_customer_id:', updateError);
        } else {
          console.log('✅ Saved new stripe_customer_id to profile:', customerId);
        }
      }
    }


    // Ensure customerId is a string (never null)
    if (!customerId) {
      throw new Error('No Stripe customer ID found or created for user');
    }

    // Create Setup Intent for saving payment methods
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // För Setup Intent
      },
      usage: "off_session",
      metadata: {
        userId: userId,
        created_by: "payment_sheet",
        created_at: new Date().toISOString(),
      },
    });

    // Create ephemeral key for customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId as string },
      { apiVersion: "2023-10-16" }
    );

    // 🔒 SECURITY: Set security headers for sensitive response
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    });

    res.json({
      setupIntent: {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret, // This is safe to send to client
      },
      ephemeralKey: {
        secret: ephemeralKey.secret, // This is safe and required for client
      },
      customer: {
        id: customerId,
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating setup intent:", error);
    res.status(500).json({ error: error.message });
  }
});

// UNIFIED SUBSCRIPTION MANAGEMENT - handles create, update, and change plans
router.post("/manage-subscription", async (req: Request, res: Response) => {
  try {
    console.log("🔍 /manage-subscription endpoint called with:", req.body);
    const { userId, stripePriceId } = req.body;

    console.log("🚀 ===== MANAGE SUBSCRIPTION START =====");
    console.log("📝 Request:", { userId, stripePriceId });

    if (!userId || !stripePriceId) {
      return res
        .status(400)
        .json({ error: "User ID and Stripe price ID are required" });
    }

    // 1. Get membership plan
    const membershipPlan = await dbService.getMembershipPlanByStripePrice(
      stripePriceId
    );
    if (!membershipPlan) {
      return res.status(404).json({ error: "Membership plan not found" });
    }
    console.log("✅ Plan found:", membershipPlan.title);

    // 2. Get user profile
    const userProfile = await dbService.getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // 3. Get or create Stripe customer
    const stripeCustomerId = await stripeService.createOrGetCustomer(
      userProfile.email || `user+${userId}@fitpass.com`,
      userProfile.display_name || userProfile.full_name || "FitPass User",
      userId
    );
    console.log("✅ Stripe customer:", stripeCustomerId);

    // 4. Check existing membership
    const existingMembership = await dbService.getUserActiveMembership(userId);

    if (existingMembership) {
      console.log("📄 Found existing membership");

      // Same plan - return existing
      if (
        existingMembership.plan_id === membershipPlan.id &&
        existingMembership.stripe_subscription_id
      ) {
        console.log("✅ User already has this plan");
        return res.json({
          subscription_id: existingMembership.stripe_subscription_id,
          status: existingMembership.stripe_status || "active",
          message: "User already has this plan",
        });
      }

      // Different plan or no Stripe subscription - handle update
      if (existingMembership.stripe_subscription_id) {
        console.log("🔄 Updating existing subscription...");
        try {
          // Try to update existing subscription
          const updatedSubscription = await stripeService.updateSubscription(
            existingMembership.stripe_subscription_id,
            stripePriceId
          );

          // Update membership in database
          await dbService.updateMembership(existingMembership.id, {
            plan_id: membershipPlan.id,
            plan_type: membershipPlan.title,
            credits: membershipPlan.credits,
            stripe_price_id: membershipPlan.stripe_price_id,
            stripe_status: updatedSubscription.status,
            start_date: new Date(
              updatedSubscription.current_period_start * 1000
            ).toISOString(),
            end_date: new Date(
              updatedSubscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          });

          console.log("✅ Subscription updated successfully");
          return res.json(updatedSubscription);
        } catch (updateError: any) {
          console.log(
            "⚠️ Update failed, creating new subscription:",
            updateError.message
          );

          // If update fails (e.g., incomplete subscription), cancel and create new
          try {
            await stripeService.cancelSubscription(
              existingMembership.stripe_subscription_id,
              false
            );
            console.log("✅ Cancelled old subscription");
          } catch (cancelError) {
            console.log("⚠️ Failed to cancel old subscription:", cancelError);
          }
        }
      }

      // Create new subscription and update existing membership
      console.log("🆕 Creating new subscription for existing membership...");
      const newSubscription = await stripeService.createSubscription(
        stripeCustomerId,
        stripePriceId
      );

      console.log("📝 About to update membership with data:", {
        membershipId: existingMembership.id,
        plan_id: membershipPlan.id,
        plan_title: membershipPlan.title,
        plan_credits: membershipPlan.credits,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: newSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: newSubscription.status,
      });

      const updatedMembership = await dbService.updateMembership(
        existingMembership.id,
        {
          plan_id: membershipPlan.id,
          plan_type: membershipPlan.title,
          credits: membershipPlan.credits,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: newSubscription.id,
          stripe_price_id: membershipPlan.stripe_price_id,
          stripe_status: newSubscription.status,
          start_date: new Date(
            newSubscription.current_period_start * 1000
          ).toISOString(),
          end_date: new Date(
            newSubscription.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      console.log("✅ Existing membership updated with new subscription");
      console.log(
        "📊 Updated membership result:",
        JSON.stringify(updatedMembership, null, 2)
      );

      // Verify the update by fetching the membership again
      const verifyMembership = await dbService.getUserActiveMembership(userId);
      console.log(
        "🔍 Verification - Current active membership:",
        JSON.stringify(verifyMembership, null, 2)
      );

      return res.json(newSubscription);
    } else {
      // No existing membership - create everything new
      console.log("🆕 Creating new membership and subscription...");

      // Create Stripe subscription
      const newSubscription = await stripeService.createSubscription(
        stripeCustomerId,
        stripePriceId
      );

      // Create membership in database
      await dbService.createMembership({
        user_id: userId,
        plan_type: membershipPlan.title || "Premium",
        credits: membershipPlan.credits || 0,
        plan_id: membershipPlan.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: newSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: newSubscription.status,
        start_date: new Date(
          newSubscription.current_period_start * 1000
        ).toISOString(),
        end_date: new Date(
          newSubscription.current_period_end * 1000
        ).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log("✅ New membership and subscription created");
      return res.json(newSubscription);
    }
  } catch (error: any) {
    console.error("❌ Subscription management error:", error);
    res
      .status(500)
      .json({ error: error.message || "Subscription management failed" });
  }
});

// LEGACY ENDPOINT - Keep for backward compatibility
router.post("/create-subscription", async (req: Request, res: Response) => {
  try {
    const { userId, stripePriceId, customerId, priceId, membershipPlanId } =
      req.body;

    let finalUserId = userId;
    let finalStripePriceId = stripePriceId || priceId;

    // If using old format, get stripePriceId from membershipPlan
    if (membershipPlanId && !finalStripePriceId) {
      const plan = await dbService.getMembershipPlanById(membershipPlanId);
      if (plan) {
        finalStripePriceId = plan.stripe_price_id;
      }
    }

    // Call the unified manage-subscription logic
    const unifiedReq = {
      ...req,
      body: { userId: finalUserId, stripePriceId: finalStripePriceId },
    };

    // Forward to unified handler (we'll implement this logic directly here for simplicity)
    console.log("🔄 Legacy endpoint redirecting to unified logic");

    if (!finalUserId || !finalStripePriceId) {
      return res
        .status(400)
        .json({ error: "User ID and Stripe price ID are required" });
    }

    // Get membership plan
    const membershipPlan = await dbService.getMembershipPlanByStripePrice(
      finalStripePriceId
    );
    if (!membershipPlan) {
      return res.status(404).json({ error: "Membership plan not found" });
    }

    // Get user profile
    const userProfile = await dbService.getUserProfile(finalUserId);
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Get or create Stripe customer
    const stripeCustomerId =
      customerId ||
      (await stripeService.createOrGetCustomer(
        userProfile.email || `user+${finalUserId}@fitpass.com`,
        userProfile.display_name || userProfile.full_name || "FitPass User",
        finalUserId
      ));

    // Create Stripe subscription
    const stripeSubscription = await stripeService.createSubscription(
      stripeCustomerId,
      finalStripePriceId
    );

    // Handle membership creation/update
    const existingMembership = await dbService.getUserActiveMembership(
      finalUserId
    );

    if (existingMembership) {
      await dbService.updateMembership(existingMembership.id, {
        plan_id: membershipPlan.id,
        plan_type: membershipPlan.title,
        credits: membershipPlan.credits,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: stripeSubscription.status,
        start_date: new Date(
          stripeSubscription.current_period_start * 1000
        ).toISOString(),
        end_date: new Date(
          stripeSubscription.current_period_end * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      await dbService.createMembership({
        user_id: finalUserId,
        plan_type: membershipPlan.title || "Premium",
        credits: membershipPlan.credits || 0,
        plan_id: membershipPlan.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: stripeSubscription.status,
        start_date: new Date(
          stripeSubscription.current_period_start * 1000
        ).toISOString(),
        end_date: new Date(
          stripeSubscription.current_period_end * 1000
        ).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.json(stripeSubscription);
  } catch (error: any) {
    console.error("Error in legacy create-subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post("/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    const canceledSubscription = await stripeService.cancelSubscription(
      subscriptionId,
      cancelAtPeriodEnd
    );

    // Update database
    await dbService.updateSubscription(subscriptionId, {
      status: canceledSubscription.status,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end,
      canceled_at: canceledSubscription.canceled_at
        ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
        : undefined,
    });

    res.json(canceledSubscription);
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sync products with Stripe (Database -> Stripe)
router.post("/sync-products", async (req: Request, res: Response) => {
  try {
    await stripeService.syncProductsWithDatabase();
    res.json({ message: "Products synced successfully" });
  } catch (error: any) {
    console.error("Error syncing products:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sync products FROM Stripe TO Database (Stripe -> Database)
router.post("/sync-products-from-stripe", async (req: Request, res: Response) => {
  try {
    const result = await stripeService.syncProductsFromStripeToDatabase();
    
    res.json({ 
      message: `Products synced from Stripe successfully! Created: ${result.created}, Updated: ${result.updated}`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get membership plans with Stripe data
router.get("/membership-plans", async (req: Request, res: Response) => {
  try {
    const plans = await dbService.getMembershipPlans();
    res.json(plans);
  } catch (error: any) {
    console.error("Error getting membership plans:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user membership status (works even without active subscription)
router.get("/user/:userId/membership", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get user's membership (active or inactive)
    const membership = await dbService.getUserActiveMembership(userId);
    
    // If no membership exists, return default state
    if (!membership) {
      return res.json({
        hasActiveMembership: false,
        membership: null,
        message: "No membership found - user can still use the app with basic features"
      });
    }

    // Return membership status
    res.json({
      hasActiveMembership: membership.is_active && membership.stripe_status === 'active',
      membership: {
        id: membership.id,
        plan_type: membership.plan_type,
        credits: membership.credits,
        stripe_status: membership.stripe_status,
        start_date: membership.start_date,
        end_date: membership.end_date,
        is_active: membership.is_active
      },
      message: membership.is_active ? "Active membership found" : "Membership exists but inactive"
    });
  } catch (error: any) {
    console.error("Error getting user membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create test membership for development (bypass Stripe)
router.post("/create-test-membership", async (req: Request, res: Response) => {
  try {
    const { userId, planType = "Premium", credits = 100 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user already has a membership
    const existingMembership = await dbService.getUserActiveMembership(userId);
    
    if (existingMembership) {
      // Update existing membership
      const updatedMembership = await dbService.updateMembership(existingMembership.id, {
        plan_type: planType,
        credits: credits,
        stripe_status: 'active',
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      });
      
      return res.json({
        success: true,
        membership: updatedMembership,
        message: "Test membership updated successfully"
      });
    } else {
      // Create new membership
      const newMembership = await dbService.createMembership({
        user_id: userId,
        plan_type: planType,
        credits: credits,
        stripe_status: 'active',
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        membership: newMembership,
        message: "Test membership created successfully"
      });
    }
  } catch (error: any) {
    console.error("Error creating test membership:", error);
    res.status(500).json({ error: error.message });
  }
});

// Complete subscription payment for testing
router.post(
  "/complete-payment/:subscriptionId",
  async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        return res.status(400).json({ error: "Subscription ID is required" });
      }

      console.log("🧪 Completing payment for subscription:", subscriptionId);
      const result = await stripeService.completeSubscriptionPayment(
        subscriptionId
      );

      if (result.success) {
        // After completing payment, sync the subscription status from Stripe
        console.log(
          "🔄 Syncing subscription status after payment completion..."
        );
        try {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          // Update database with current Stripe status
          const { data: membership, error } = await supabase
            .from("memberships")
            .update({
              stripe_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId)
            .select()
            .single();

          if (error) {
            console.error("❌ Error updating membership status:", error);
          } else {
            console.log(
              "✅ Membership status updated:",
              membership?.stripe_status
            );
          }
        } catch (syncError) {
          console.error("⚠️ Error syncing subscription status:", syncError);
        }

        res.json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, error: result.message });
      }
    } catch (error: any) {
      console.error("Error completing payment:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all incomplete subscriptions for testing
router.get("/incomplete-subscriptions", async (req: Request, res: Response) => {
  try {
    console.log("📋 Getting all incomplete subscriptions...");

    // Get all active memberships with incomplete stripe status
    const { data: memberships, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("is_active", true)
      .eq("stripe_status", "incomplete");

    if (error) throw error;

    res.json({ data: memberships || [] });
  } catch (error: any) {
    console.error("Error getting incomplete subscriptions:", error);
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive sync of all subscriptions from Stripe
router.post("/sync-all-subscriptions", async (req: Request, res: Response) => {
  try {
    console.log("🔄 Starting comprehensive subscription sync from Stripe...");

    const result = await stripeService.syncSubscriptionsFromStripe();

    res.json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.updated} updated`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error syncing subscriptions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to sync subscriptions from Stripe",
    });
  }
});

// Comprehensive bi-directional sync (Database ↔ Stripe)
router.post("/comprehensive-sync", async (req: Request, res: Response) => {
  try {
    console.log("🔄 Starting comprehensive bi-directional sync...");

    const { AutoSyncService } = await import("../services/autoSync");
    const result = await AutoSyncService.performComprehensiveSync();

    res.json({
      success: result.success,
      message: `Comprehensive sync completed`,
      data: {
        syncedFromStripe: result.syncedFromStripe,
        syncedToStripe: result.syncedToStripe,
        errors: result.errors,
        summary: `From Stripe: ${result.syncedFromStripe.created} created, ${result.syncedFromStripe.updated} updated | To Stripe: ${result.syncedToStripe.created} created, ${result.syncedToStripe.updated} updated`
      },
    });
  } catch (error: any) {
    console.error("Error in comprehensive sync:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to perform comprehensive sync",
    });
  }
});

// Auto-sync status endpoint
router.get("/auto-sync-status", async (req: Request, res: Response) => {
  try {
    console.log("🔍 Checking auto-sync status...");

    // Check for memberships without Stripe subscriptions
    const { data: unsyncedMemberships, error } = await supabase
      .from("memberships")
      .select("id, user_id, plan_type, stripe_price_id")
      .eq("is_active", true)
      .not("plan_id", "is", null)
      .not("stripe_price_id", "is", null)
      .is("stripe_subscription_id", null);

    if (error) throw error;

    // Check for incomplete subscriptions
    const { data: incompleteSubscriptions, error: incompleteError } = await supabase
      .from("memberships")
      .select("id, user_id, plan_type, stripe_status")
      .eq("is_active", true)
      .eq("stripe_status", "incomplete");

    if (incompleteError) throw incompleteError;

    res.json({
      success: true,
      autoSyncEnabled: true,
      status: {
        unsyncedMemberships: unsyncedMemberships?.length || 0,
        incompleteSubscriptions: incompleteSubscriptions?.length || 0,
        needsAttention: (unsyncedMemberships?.length || 0) + (incompleteSubscriptions?.length || 0) > 0
      },
      details: {
        unsyncedMemberships: unsyncedMemberships || [],
        incompleteSubscriptions: incompleteSubscriptions || []
      }
    });
  } catch (error: any) {
    console.error("Error checking auto-sync status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to check auto-sync status",
    });
  }
});

// Sync scheduler control endpoints
router.post("/scheduler/start", async (req: Request, res: Response) => {
  try {
    const { syncScheduler } = await import("../services/syncScheduler");
    syncScheduler.startAutoSync();
    
    res.json({
      success: true,
      message: "Auto-sync scheduler started",
      status: syncScheduler.getStatus()
    });
  } catch (error: any) {
    console.error("Error starting scheduler:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to start scheduler",
    });
  }
});

router.post("/scheduler/stop", async (req: Request, res: Response) => {
  try {
    const { syncScheduler } = await import("../services/syncScheduler");
    syncScheduler.stopAutoSync();
    
    res.json({
      success: true,
      message: "Auto-sync scheduler stopped",
      status: syncScheduler.getStatus()
    });
  } catch (error: any) {
    console.error("Error stopping scheduler:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to stop scheduler",
    });
  }
});

router.get("/scheduler/status", async (req: Request, res: Response) => {
  try {
    const { syncScheduler } = await import("../services/syncScheduler");
    const status = syncScheduler.getStatus();
    
    res.json({
      success: true,
      scheduler: status
    });
  } catch (error: any) {
    console.error("Error getting scheduler status:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to get scheduler status",
    });
  }
});

router.post("/scheduler/trigger", async (req: Request, res: Response) => {
  try {
    const { type = 'comprehensive' } = req.body;
    const { syncScheduler } = await import("../services/syncScheduler");
    
    const result = await syncScheduler.triggerManualSync(type);
    
    res.json({
      success: result.success,
      message: result.message || `Manual ${type} sync completed`,
      data: result
    });
  } catch (error: any) {
    console.error("Error triggering manual sync:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to trigger manual sync",
    });
  }
});

// PAYMENT METHODS MANAGEMENT
// Create a payment method for testing
router.post("/create-payment-method", async (req: Request, res: Response) => {
  try {
    const { customerId, cardNumber, expMonth, expYear, cvc, isUserAdded } =
      req.body;

    let actualCustomerId = customerId;

    // If no customer ID provided, we need to create a customer
    if (!actualCustomerId) {
      // We need user info to create a customer
      const { userId, email, name } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ 
          error: "Customer ID is required, or userId and email must be provided to create a new customer" 
        });
      }
      
      try {
        // Create customer using the stripe service
        actualCustomerId = await stripeService.createOrGetCustomer(
          email,
          name || email.split('@')[0], // Use email prefix as name fallback
          userId
        );
      } catch (createError: any) {
        return res.status(500).json({
          success: false,
          error: createError.message,
          message: "Failed to create customer"
        });
      }
    }

    // In test mode, use token-based approach for security
    let paymentMethod: Stripe.PaymentMethod;

    if (process.env.NODE_ENV === "development") {
      // Map common test card numbers to tokens
      const testTokenMap: { [key: string]: string } = {
        "4242424242424242": "tok_visa",
        "4000000000000002": "tok_visa_debit",
        "5555555555554444": "tok_mastercard",
        "4000002500003155": "tok_visa", // 3D Secure
        "4000000000009995": "tok_visa", // Insufficient funds
      };

      const token = testTokenMap[cardNumber] || "tok_visa";

      paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          token: token,
        },
        // Mark if this was user-added vs auto-generated
        metadata: {
          user_added: isUserAdded !== false ? "true" : "false",
          created_via: "fitpass_app",
          card_number_hint: cardNumber ? cardNumber.slice(-4) : "4242",
        },
      });
    } else {
      // In production, you would use Stripe Elements or similar secure method
      // This is just a fallback - never use raw card data in production
      paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          number: cardNumber || "4242424242424242",
          exp_month: expMonth || 12,
          exp_year: expYear || 2028,
          cvc: cvc || "123",
        },
        metadata: {
          user_added: "true",
          created_via: "fitpass_app",
        },
      });
    }

    // Attach to customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: actualCustomerId,
    });

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            }
          : null,
      },
      customerId: actualCustomerId, // Return the customer ID that was used/created
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to create payment method",
    });
  }
});

// Set default payment method for customer
router.post(
  "/set-default-payment-method",
  async (req: Request, res: Response) => {
    try {
      console.log(
        "🔍 /set-default-payment-method endpoint called with:",
        req.body
      );
      const { customerId, paymentMethodId } = req.body;

      if (!customerId || !paymentMethodId) {
        return res
          .status(400)
          .json({ error: "Customer ID and Payment Method ID are required" });
      }

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log("✅ Default payment method set:", paymentMethodId);

      res.json({
        success: true,
        message: "Default payment method updated",
      });
    } catch (error: any) {
      console.error("❌ Error setting default payment method:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to set default payment method",
      });
    }
  }
);

// Get customer payment methods
router.get(
  "/customer/:customerId/payment-methods",
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      // 🔒 SECURITY: Validate customer ID format
      if (!customerId || !customerId.startsWith("cus_")) {
        return res.status(400).json({
          success: false,
          error: "Invalid customer ID format",
          message: "Customer ID must be a valid Stripe customer ID",
        });
      }

      console.log("🔍 Getting payment methods for customer:", customerId);

      // 🔒 SECURITY: Set security headers
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      });

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      // 🔒 SECURITY: Log only safe information, never full card details
      console.log(
        "📊 Found payment methods count:",
        paymentMethods.data.length
      );

      // Get customer to see default payment method
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = customer.deleted
        ? null
        : (customer.invoice_settings?.default_payment_method as string | null);

      // Check if customer has real (user-added) payment methods
      const hasRealPaymentMethods =
        await stripeService.customerHasRealPaymentMethods(customerId);

      res.json({
        success: true,
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => {
          // 🔒 SECURITY: Never expose full card information
          const securePaymentMethod: any = {
            id: pm.id,
            type: pm.type,
            isDefault: pm.id === defaultPaymentMethodId,
            isUserAdded: pm.metadata?.user_added === "true",
            isAutoGenerated: pm.metadata?.auto_generated === "true",
            created: pm.created,
            billing_details: {
              // Only expose safe billing details (no sensitive info)
              name: pm.billing_details?.name || null,
              email: pm.billing_details?.email || null,
            },
          };

          // Only include minimal, safe card information
          if (pm.card) {
            securePaymentMethod.card = {
              brand: pm.card.brand, // visa, mastercard, etc.
              last4: pm.card.last4, // Only last 4 digits
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding, // credit, debit, prepaid
              country: pm.card.country, // card issuing country
              // 🔒 NEVER include: full number, CVC, fingerprint, etc.
            };
          }

          return securePaymentMethod;
        }),
      });
    } catch (error: any) {
      console.error("❌ Error getting payment methods:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get payment methods",
      });
    }
  }
);

// Get customer subscription directly from Stripe
router.get(
  "/customer/:customerId/subscription", 
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;

      // 🔒 SECURITY: Validate customer ID format
      if (!customerId || !customerId.startsWith("cus_")) {
        return res.status(400).json({
          success: false,
          error: "Invalid customer ID format", 
          message: "Customer ID must be a valid Stripe customer ID",
        });
      }

      console.log(`🔍 Getting subscription for customer: ${customerId}`);

      // 🔒 SECURITY: Set security headers
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache", 
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      });

      // Get active subscriptions for customer from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        console.log('❌ No active subscription found for customer');
        return res.json({ success: true, subscription: null });
      }

      const subscription = subscriptions.data[0];
      const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

      const subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        plan_name: product.name,
        amount: subscription.items.data[0].price.unit_amount || 0,
        currency: subscription.currency,
        interval: subscription.items.data[0].price.recurring?.interval || 'month',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        next_billing_date: subscription.cancel_at_period_end ? null : new Date(subscription.current_period_end * 1000).toISOString(),
        days_until_renewal: subscription.cancel_at_period_end ? null : Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
      };

      console.log('✅ Successfully retrieved customer subscription from Stripe');
      res.json({ success: true, subscription: subscriptionData });

    } catch (error: any) {
      console.error('❌ Error getting customer subscription:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get customer subscription"
      });
    }
  }
);

// Delete payment method
router.delete(
  "/payment-method/:paymentMethodId",
  async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.params;
      console.log("🔍 Deleting payment method:", paymentMethodId);

      await stripe.paymentMethods.detach(paymentMethodId);

      console.log("✅ Payment method deleted:", paymentMethodId);

      res.json({
        success: true,
        message: "Payment method deleted",
      });
    } catch (error: any) {
      console.error("❌ Error deleting payment method:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to delete payment method",
      });
    }
  }
);

// Get payment methods for user by userId
router.post(
  "/user/:userId/payment-methods",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      console.log("🔍 Getting payment methods for user:", userId, "email:", email);

      // 🔒 SECURITY: Set security headers
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      });

      // First, try to find or create the customer
      let customerId: string | null = null;

      // Check if user already has a Stripe customer ID
      const { data: existingCustomer, error: customerError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      console.log("🔍 Profile customer check:", { data: existingCustomer, error: customerError });

      if (existingCustomer?.stripe_customer_id) {
        customerId = existingCustomer.stripe_customer_id;
        console.log("✅ Found existing customer ID in database:", customerId);
      } else if (email) {
        // Use stripeService to get or create customer (prevents duplicates)
        console.log("🔍 Getting or creating Stripe customer for email:", email);
        customerId = await stripeService.createOrGetCustomer(
          email,
          email, // Use email as name fallback
          userId
        );

        // Update profile with customer ID
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);

        if (updateError) {
          console.error("❌ Error saving customer ID to profiles:", updateError);
        } else {
          console.log("✅ Saved customer ID to profiles table:", customerId);
        }

        console.log("✅ Customer ready:", customerId);
      } else {
        return res.status(400).json({
          success: false,
          error: "Email required for new customers",
          hasRealPaymentMethods: false,
        });
      }

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Could not determine customer ID",
          hasRealPaymentMethods: false,
        });
      }

      // Get payment methods for this customer
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      // Check if customer has real payment methods
      const hasRealPaymentMethods =
        await stripeService.customerHasRealPaymentMethods(customerId);

      console.log(
        "📊 Found payment methods count:",
        paymentMethods.data.length,
        "hasReal:",
        hasRealPaymentMethods
      );

      res.json({
        success: true,
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => {
          // 🔒 SECURITY: Never expose full card information
          return {
            id: pm.id,
            type: pm.type,
            card: pm.card ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding,
              country: pm.card.country,
            } : null,
            created: pm.created,
          };
        }),
        customerId,
      });
    } catch (error: any) {
      console.error("❌ Error getting user payment methods:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get payment methods",
        hasRealPaymentMethods: false,
      });
    }
  }
);

// Get Stripe customer ID for user
router.get(
  "/user/:userId/customer-id",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      console.log("🔍 Getting Stripe customer ID for user:", userId);

      // 🔒 SECURITY: Set security headers
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      });

      // Check if user already has a Stripe customer ID in profiles table first
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      console.log("🔍 Profiles table check:", { data: existingProfile, error: profileError });

      if (existingProfile?.stripe_customer_id) {
        console.log("✅ Found existing customer ID in profiles table:", existingProfile.stripe_customer_id);
        res.json({
          success: true,
          customerId: existingProfile.stripe_customer_id,
        });
        return;
      }

      // Also check memberships table for customer ID
      const { data: existingMembership, error: membershipError } = await supabase
        .from("memberships")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("🔍 Memberships table check:", { data: existingMembership, error: membershipError });

      if (existingMembership?.stripe_customer_id) {
        console.log("✅ Found existing customer ID in memberships table:", existingMembership.stripe_customer_id);
        res.json({
          success: true,
          customerId: existingMembership.stripe_customer_id,
        });
      } else {
        console.log("❌ No customer ID found for user:", userId);
        res.json({
          success: true,
          customerId: null,
        });
      }
    } catch (error: any) {
      console.error("❌ Error getting customer ID:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get customer ID",
      });
    }
  }
);

// Force sync payment methods for user (development/debugging)
router.post(
  "/user/:userId/sync-payment-methods",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      console.log("🔄 FORCE SYNC: Getting payment methods for user:", userId, "email:", email);

      // Get customer ID
      let customerId: string | null = null;

      const { data: existingCustomer, error: customerError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      if (existingCustomer?.stripe_customer_id) {
        customerId = existingCustomer.stripe_customer_id;
        console.log("🔄 FORCE SYNC: Found customer ID:", customerId);
      } else if (email) {
        customerId = await stripeService.createOrGetCustomer(email, email, userId);
        console.log("🔄 FORCE SYNC: Created customer ID:", customerId);
      } else {
        return res.status(400).json({
          success: false,
          error: "Email required for customer lookup",
        });
      }

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Could not determine customer ID",
        });
      }

      // Force refresh from Stripe
      console.log("🔄 FORCE SYNC: Fetching fresh data from Stripe...");
      
      const [paymentMethods, customer] = await Promise.all([
        stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
        }),
        stripe.customers.retrieve(customerId)
      ]);

      const defaultPaymentMethodId = customer.deleted ? null : 
        (customer as Stripe.Customer).invoice_settings?.default_payment_method;

      // Check if customer has real payment methods
      const hasRealPaymentMethods =
        await stripeService.customerHasRealPaymentMethods(customerId);

      console.log("🔄 FORCE SYNC: Fresh results:");
      console.log("  - Payment methods count:", paymentMethods.data.length);
      console.log("  - Has real payment methods:", hasRealPaymentMethods);
      console.log("  - Default payment method:", defaultPaymentMethodId);
      
      if (paymentMethods.data.length > 0) {
        console.log("  - Payment method details:");
        paymentMethods.data.forEach((pm, index) => {
          console.log(`    ${index + 1}. ${pm.card?.brand} •••• ${pm.card?.last4} (${pm.id})`);
          console.log(`       Created: ${new Date(pm.created * 1000).toISOString()}`);
          console.log(`       Metadata:`, pm.metadata);
        });
      }

      res.json({
        success: true,
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
            country: pm.card.country,
          } : null,
          created: pm.created,
          isDefault: pm.id === defaultPaymentMethodId,
          metadata: pm.metadata,
        })),
        customerId,
        syncTimestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ FORCE SYNC: Error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to sync payment methods",
      });
    }
  }
);

// Set default payment method for customer
router.post(
  "/customer/:customerId/default-payment-method",
  async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const { paymentMethodId } = req.body;

      console.log("🔧 Setting default payment method:", paymentMethodId, "for customer:", customerId);

      // 🔒 SECURITY: Validate customer ID format
      if (!customerId || !customerId.startsWith("cus_")) {
        return res.status(400).json({
          success: false,
          error: "Invalid customer ID format",
          message: "Customer ID must be a valid Stripe customer ID",
        });
      }

      // 🔒 SECURITY: Validate payment method ID format
      if (!paymentMethodId || !paymentMethodId.startsWith("pm_")) {
        return res.status(400).json({
          success: false,
          error: "Invalid payment method ID format",
          message: "Payment method ID must be a valid Stripe payment method ID",
        });
      }

      // 🔒 SECURITY: Set security headers
      res.set({
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      });

      // Update customer's default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      console.log("✅ Default payment method set successfully");

      // Get updated payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      res.json({
        success: true,
        message: "Default payment method set successfully",
        paymentMethods: paymentMethods.data.map((pm) => {
          return {
            id: pm.id,
            type: pm.type,
            card: pm.card ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
              funding: pm.card.funding,
              country: pm.card.country,
            } : null,
            created: pm.created,
          };
        }),
      });
    } catch (error: any) {
      console.error("❌ Error setting default payment method:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to set default payment method",
      });
    }
  }
);

// Get detailed payment method information
router.get(
  "/payment-method/:paymentMethodId/details",
  async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.params;

      console.log("🔍 Getting payment method details for:", paymentMethodId);

      // Get the payment method from Stripe
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      res.json({
        success: true,
        paymentMethod: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year,
            funding: paymentMethod.card.funding,
            country: paymentMethod.card.country,
          } : null,
          billing_details: paymentMethod.billing_details,
          created: paymentMethod.created,
          metadata: paymentMethod.metadata,
        },
      });
    } catch (error: any) {
      console.error("❌ Error getting payment method details:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to get payment method details",
      });
    }
  }
);

// Update payment method billing details
router.put(
  "/payment-method/:paymentMethodId/update",
  async (req: Request, res: Response) => {
    try {
      const { paymentMethodId } = req.params;
      const { billingDetails, metadata } = req.body;

      console.log("🔄 Updating payment method:", paymentMethodId, "with billing details:", billingDetails, "and metadata:", metadata);

      const updateData: any = {};
      if (billingDetails) {
        updateData.billing_details = billingDetails;
      }
      if (metadata) {
        updateData.metadata = metadata;
      }

      // Update the payment method in Stripe
      const updatedPaymentMethod = await stripe.paymentMethods.update(
        paymentMethodId,
        updateData
      );

      res.json({
        success: true,
        message: "Payment method updated successfully",
        paymentMethod: {
          id: updatedPaymentMethod.id,
          type: updatedPaymentMethod.type,
          card: updatedPaymentMethod.card ? {
            brand: updatedPaymentMethod.card.brand,
            last4: updatedPaymentMethod.card.last4,
            exp_month: updatedPaymentMethod.card.exp_month,
            exp_year: updatedPaymentMethod.card.exp_year,
            funding: updatedPaymentMethod.card.funding,
            country: updatedPaymentMethod.card.country,
          } : null,
          billing_details: updatedPaymentMethod.billing_details,
          created: updatedPaymentMethod.created,
          metadata: updatedPaymentMethod.metadata,
        },
      });
    } catch (error: any) {
      console.error("❌ Error updating payment method:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to update payment method",
      });
    }
  }
);

// Get user subscription
router.get("/user/:userId/subscription", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Getting subscription for user: ${userId}`);

    // Get user's membership from database
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !membership) {
      console.log('❌ No membership found for user');
      return res.json({ success: true, subscription: null });
    }

    if (!membership.stripe_subscription_id) {
      console.log('❌ No Stripe subscription ID found');
      return res.json({ success: true, subscription: null });
    }

    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      plan_name: product.name,
      amount: subscription.items.data[0].price.unit_amount || 0,
      currency: subscription.currency,
      interval: subscription.items.data[0].price.recurring?.interval || 'month',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      next_billing_date: subscription.cancel_at_period_end ? null : new Date(subscription.current_period_end * 1000).toISOString(),
      days_until_renewal: subscription.cancel_at_period_end ? null : Math.ceil((subscription.current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    };

    console.log('✅ Successfully retrieved subscription');
    res.json({ success: true, subscription: subscriptionData });

  } catch (error: any) {
    console.error('❌ Error getting subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to get subscription"
    });
  }
});

// Cancel user subscription (at period end)
router.post("/user/:userId/subscription/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    console.log(`🔍 Canceling subscription for user: ${userId}, reason: ${reason}`);

    // Get user's membership from database
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !membership?.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No active subscription found"
      });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: reason || 'User requested cancellation'
      }
    });

    console.log('✅ Successfully canceled subscription at period end');
    res.json({
      success: true,
      message: `Din prenumeration kommer att avslutas ${new Date(subscription.current_period_end * 1000).toLocaleDateString('sv-SE')}`
    });

  } catch (error: any) {
    console.error('❌ Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to cancel subscription"
    });
  }
});

// Reactivate user subscription
router.post("/user/:userId/subscription/reactivate", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Reactivating subscription for user: ${userId}`);

    // Get user's membership from database
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !membership?.stripe_subscription_id) {
      return res.status(404).json({
        success: false,
        error: "No subscription found"
      });
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
      cancel_at_period_end: false
    });

    console.log('✅ Successfully reactivated subscription');
    res.json({
      success: true,
      message: "Din prenumeration har återaktiverats och kommer att förnyas automatiskt"
    });

  } catch (error: any) {
    console.error('❌ Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to reactivate subscription"
    });
  }
});

// Get billing history
router.get("/user/:userId/billing-history", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(`🔍 Getting billing history for user: ${userId}`);

    // Get customer ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      console.log('❌ No customer ID found for user');
      return res.json({ success: true, history: [] });
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 50
    });

    const history = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000).toISOString(),
      description: invoice.lines.data[0]?.description || 'FitPass Subscription',
      invoice_url: invoice.hosted_invoice_url
    }));

    console.log(`✅ Successfully retrieved ${history.length} invoices`);
    res.json({ success: true, history });

  } catch (error: any) {
    console.error('❌ Error getting billing history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to get billing history"
    });
  }
});

// 🔄 AUTO-SYNC: Sync subscription when membership plan changes
router.post('/sync-subscription-update', async (req: Request, res: Response) => {
  try {
    const { subscriptionId, newPriceId, membershipId } = req.body;

    if (!subscriptionId || !newPriceId || !membershipId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subscriptionId, newPriceId, membershipId'
      });
    }

    console.log('🔄 AUTO-SYNC: Updating Stripe subscription for membership plan change');
    console.log('📊 Update details:', {
      subscriptionId: subscriptionId.substring(0, 20) + '...',
      newPriceId: newPriceId.substring(0, 20) + '...',
      membershipId
    });

    // Get current subscription and new price details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPrice = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(newPriceId);

    console.log('💰 Currency check:', {
      currentCurrency: currentPrice.currency,
      newCurrency: newPrice.currency,
      compatible: currentPrice.currency === newPrice.currency
    });

    // Check if currencies are compatible
    if (currentPrice.currency !== newPrice.currency) {
      console.warn('⚠️ AUTO-SYNC: Currency mismatch detected - cannot update existing subscription');
      console.log('💡 AUTO-SYNC: Would need to create new subscription for currency change');
      
      return res.status(400).json({
        success: false,
        error: `Currency mismatch: Current subscription uses ${currentPrice.currency.toUpperCase()}, new price uses ${newPrice.currency.toUpperCase()}. Cannot change currency on existing subscriptions.`,
        message: 'Currency change requires new subscription',
        suggestion: 'Consider creating a new subscription or using prices with the same currency'
      });
    }

    // Update Stripe subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Handle prorations automatically
    });

    console.log('✅ AUTO-SYNC: Stripe subscription updated');

    // Update membership with new Stripe data
    await dbService.updateMembership(membershipId, {
      stripe_price_id: newPriceId,
      stripe_status: updatedSubscription.status,
      start_date: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('✅ AUTO-SYNC: Membership updated with new Stripe data');

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

// Manual sync endpoint to force refresh of payment methods (for development)
router.post(
  "/user/:userId/sync-payment-methods",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { email } = req.body;

      console.log("🔄 Manual sync requested for user:", userId);

      // Get customer ID
      const { data: existingCustomer, error: customerError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      if (!existingCustomer?.stripe_customer_id) {
        return res.json({
          success: true,
          message: "No Stripe customer found",
          paymentMethods: [],
          hasRealPaymentMethods: false,
        });
      }

      const customerId = existingCustomer.stripe_customer_id;

      // Get fresh payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      // Get the customer to check for default payment method
      const customer = await stripe.customers.retrieve(customerId);
      const defaultPaymentMethodId = customer.deleted ? null : 
        (customer as Stripe.Customer).invoice_settings?.default_payment_method;

      // Check if customer has real payment methods
      const hasRealPaymentMethods =
        await stripeService.customerHasRealPaymentMethods(customerId);

      console.log(
        "🔄 Manual sync results:",
        paymentMethods.data.length,
        "payment methods found, hasReal:",
        hasRealPaymentMethods
      );

      res.json({
        success: true,
        message: `Found ${paymentMethods.data.length} payment methods`,
        hasRealPaymentMethods,
        paymentMethods: paymentMethods.data.map((pm) => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
            country: pm.card.country,
          } : null,
          created: pm.created,
          isDefault: pm.id === defaultPaymentMethodId,
          metadata: pm.metadata,
        })),
        customerId,
      });
    } catch (error: any) {
      console.error("❌ Error in manual sync:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: "Failed to sync payment methods",
      });
    }
  }
);

export default router;
