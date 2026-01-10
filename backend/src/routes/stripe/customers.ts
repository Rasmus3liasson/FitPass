import { Request, Response, Router } from "express";
import { supabase } from "../../services/database";
import { stripe } from "../../services/stripe";

const router: Router = Router();

// Test endpoint
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Stripe API is working",
  });
});

// Create Stripe customer
router.post("/create-customer", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    const customer = await stripe.customers.create({
      email,
      name,
    });

    res.json({ customer });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get or create customer with setup intent and ephemeral key (for Payment Sheet)
router.post("/get-customer", async (req: Request, res: Response) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "User ID and email are required" });
    }

    let customerId: string | null = null;

    // Check if user already has a stripe_customer_id in memberships
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Database error:", membershipError);
      throw membershipError;
    }

    customerId = membership?.stripe_customer_id || null;

    if (!customerId) {
      // Get user profile for customer ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      customerId = profile?.stripe_customer_id || null;
    }

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: name || email,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to update profile with customer ID:", updateError);
      }
    }

    // Verify the customer exists in Stripe
    try {
      await stripe.customers.retrieve(customerId);
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        // Customer doesn't exist in Stripe, create a new one
        const customer = await stripe.customers.create({
          email,
          name: name || email,
          metadata: {
            user_id: userId,
          },
        });

        customerId = customer.id;

        // Update the customer ID in the database
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);
      } else {
        throw stripeError;
      }
    }

    // Create ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    // Create setup intent for saving payment methods
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    res.json({
      success: true,
      setupIntent: {
        client_secret: setupIntent.client_secret,
      },
      ephemeralKey: {
        secret: ephemeralKey.secret,
      },
      customer: {
        id: customerId,
      },
    });
  } catch (error: any) {
    console.error("Error in get-customer:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get customer ID
router.post("/get-customer-id", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user already has a stripe_customer_id in memberships
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Database error:", membershipError);
      throw membershipError;
    }

    let customerId = membership?.stripe_customer_id;

    if (!customerId) {
      // Get user profile for email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, stripe_customer_id")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      // Check if profile already has a customer ID
      if (profile.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          metadata: {
            user_id: userId,
          },
        });

        customerId = customer.id;

        // Save customer ID to profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);

        if (updateError) {
          console.error("Failed to update profile with customer ID:", updateError);
        }
      }
    }

    res.json({
      success: true,
      customerId,
    });
  } catch (error: any) {
    console.error("Error getting customer ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get customer ID by user ID (for billing service)
router.get("/user/:userId/customer-id", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user already has a stripe_customer_id in memberships
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (membershipError && membershipError.code !== "PGRST116") {
      console.error("Database error:", membershipError);
      throw membershipError;
    }

    let customerId = membership?.stripe_customer_id;

    if (!customerId) {
      // Get user profile for customer ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      customerId = profile.stripe_customer_id;
    }

    if (!customerId) {
      return res.status(404).json({
        success: false,
        error: "No Stripe customer found for user",
      });
    }

    res.json({
      success: true,
      customerId,
    });
  } catch (error: any) {
    console.error("Error getting customer ID:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create setup intent
router.post("/create-setup-intent", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;