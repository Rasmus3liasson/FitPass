import dotenv from "dotenv";
import Stripe from "stripe";
import { dbService, supabase } from "./database";

// Load environment variables from root directory
dotenv.config({ path: "../.env" });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("STRIPE"))
  );
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export class StripeService {
  // Helper method to check if customer has real payment methods (not just test cards)
  async customerHasRealPaymentMethods(customerId: string): Promise<boolean> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      if (paymentMethods.data.length === 0) {
        return false;
      }

      // In development, treat any card as "real" for easier testing
      if (process.env.NODE_ENV === "development") {
        return paymentMethods.data.length > 0;
      }

      // In production, any payment method is considered "real"
      return true;
    } catch (error) {
      console.error("Error checking customer payment methods:", error);
      return false;
    }
  }

  // Create or get Stripe customer
  async createOrGetCustomer(
    email: string,
    name: string,
    userId?: string
  ): Promise<string> {
    // For SEK currency, create a unique customer to avoid currency conflicts
    const uniqueEmail = `${email.split("@")[0]}+sek@${email.split("@")[1]}`;

    // First, try to find existing SEK customer
    const customers = await stripe.customers.list({
      email: uniqueEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      console.log("🔍 Found existing SEK customer:", customerId);
      return customerId;
    }

    // Create new SEK customer
    const customer = await stripe.customers.create({
      email: uniqueEmail,
      name: `${name} (SEK)`,
      metadata: userId
        ? { user_id: userId, currency: "sek" }
        : { currency: "sek" },
    });

    console.log("🆕 Created new SEK customer:", customer.id);
    return customer.id;
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string,
    completePayment: boolean = true
  ): Promise<Stripe.Subscription> {
    console.log("🔄 Creating Stripe subscription:", {
      customerId,
      priceId,
      completePayment,
    });

    try {
      // First, try to create subscription normally
      let subscription: Stripe.Subscription;

      try {
        subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: completePayment
            ? "default_incomplete"
            : "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"],
        });

        console.log(
          "✅ Stripe subscription created successfully:",
          subscription.id
        );

        // If subscription was created but payment is incomplete and we're in test mode,
        // try to help with payment completion
        if (
          completePayment &&
          process.env.NODE_ENV === "development" &&
          subscription.status === "incomplete" &&
          subscription.latest_invoice
        ) {
          const invoice = subscription.latest_invoice as Stripe.Invoice;
          if (
            invoice.payment_intent &&
            typeof invoice.payment_intent === "object"
          ) {
            const paymentIntent =
              invoice.payment_intent as Stripe.PaymentIntent;

            if (paymentIntent.status === "requires_payment_method") {
              console.log(
                "⚠️ Payment requires payment method. Checking if customer has any payment methods..."
              );

              // Check if customer has any payment methods
              const existingMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: "card",
              });

              if (existingMethods.data.length === 0) {
                console.log(
                  "🧪 No payment methods found. Adding test payment method for development..."
                );

                // Only now add a test payment method as fallback
                const paymentMethod = await stripe.paymentMethods.create({
                  type: "card",
                  card: {
                    token: "tok_visa", // Use test token for security
                  },
                  metadata: {
                    auto_generated: "true",
                    created_via: "stripe_service_fallback",
                    reason: "no_payment_methods_found",
                  },
                });

                // Attach to customer
                await stripe.paymentMethods.attach(paymentMethod.id, {
                  customer: customerId,
                });

                // Set as default
                await stripe.customers.update(customerId, {
                  invoice_settings: {
                    default_payment_method: paymentMethod.id,
                  },
                });

                console.log("✅ Test payment method added as fallback");

                // Try to confirm payment with the new method
                try {
                  await stripe.paymentIntents.confirm(paymentIntent.id, {
                    payment_method: paymentMethod.id,
                  });
                  console.log(
                    "✅ Payment confirmed with fallback payment method"
                  );
                } catch (confirmError) {
                  console.log(
                    "⚠️ Could not confirm payment with fallback method:",
                    confirmError
                  );
                }
              } else {
                console.log(
                  "✅ Customer has existing payment methods, no fallback needed"
                );
              }
            }
          }
        }

        return subscription;
      } catch (subscriptionError: any) {
        console.log(
          "⚠️ Initial subscription creation failed:",
          subscriptionError.message
        );

        // If subscription fails due to payment method issues and we're in development,
        // add a fallback payment method and retry
        if (
          completePayment &&
          process.env.NODE_ENV === "development" &&
          (subscriptionError.message.includes("payment") ||
            subscriptionError.message.includes("card") ||
            subscriptionError.code === "incomplete_payment_method")
        ) {
          console.log(
            "🧪 Adding fallback payment method for development and retrying..."
          );

          // Check if customer already has payment methods
          const existingMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
          });

          if (existingMethods.data.length === 0) {
            // Create and attach test payment method
            const paymentMethod = await stripe.paymentMethods.create({
              type: "card",
              card: {
                token: "tok_visa",
              },
              metadata: {
                auto_generated: "true",
                created_via: "stripe_service_fallback",
                reason: "subscription_creation_failed",
              },
            });

            await stripe.paymentMethods.attach(paymentMethod.id, {
              customer: customerId,
            });

            await stripe.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: paymentMethod.id,
              },
            });

            console.log(
              "✅ Fallback payment method added, retrying subscription creation..."
            );

            // Retry subscription creation
            subscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: priceId }],
              payment_behavior: "default_incomplete",
              payment_settings: {
                save_default_payment_method: "on_subscription",
              },
              expand: ["latest_invoice.payment_intent"],
            });

            console.log(
              "✅ Subscription created successfully with fallback payment method"
            );
            return subscription;
          } else {
            console.log(
              "⚠️ Customer has payment methods but subscription still failed"
            );
            throw subscriptionError;
          }
        } else {
          throw subscriptionError;
        }
      }
    } catch (error) {
      console.error("❌ Stripe subscription creation failed:", error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
      }
    );

    return updatedSubscription;
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
  }

  // Pause subscription - prevents billing
  async pauseSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: "void", // Don't create invoices during pause
      },
    });
  }

  // Resume subscription
  async resumeSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });
  }

  // Complete subscription payment for testing
  async completeSubscriptionPayment(
    subscriptionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        "🧪 Attempting to complete payment for subscription:",
        subscriptionId
      );

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["latest_invoice.payment_intent"],
      });

      if (!subscription.latest_invoice) {
        return { success: false, message: "No invoice found for subscription" };
      }

      const invoice = subscription.latest_invoice as Stripe.Invoice;

      if (!invoice.payment_intent) {
        return { success: false, message: "No payment intent found" };
      }

      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      if (paymentIntent.status === "succeeded") {
        return { success: true, message: "Payment already completed" };
      }

      // For testing, use a test payment method
      if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "requires_confirmation"
      ) {
        await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: "pm_card_visa",
        });

        console.log(
          "✅ Test payment completed for subscription:",
          subscriptionId
        );
        return { success: true, message: "Payment completed successfully" };
      }

      return {
        success: false,
        message: `Payment intent status: ${paymentIntent.status}`,
      };
    } catch (error: any) {
      console.error("❌ Error completing subscription payment:", error);
      return { success: false, message: error.message };
    }
  }

  // Sync products with database
  async syncProductsWithDatabase(): Promise<void> {
    console.log("🔄 Starting Stripe product sync...");

    // Get all membership plans from database
    const membershipPlans = await dbService.getMembershipPlans();

    for (const plan of membershipPlans) {
      try {
        // Create or update Stripe product
        let stripeProduct: Stripe.Product;

        if (plan.stripe_product_id) {
          // Update existing product
          stripeProduct = await stripe.products.update(plan.stripe_product_id, {
            name: plan.title,
            description: plan.description,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`✅ Updated Stripe product: ${stripeProduct.name}`);
        } else {
          // Create new product
          stripeProduct = await stripe.products.create({
            name: plan.title,
            description: plan.description,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`🆕 Created Stripe product: ${stripeProduct.name}`);
        }

        // Create or update price
        let stripePrice: Stripe.Price;

        if (plan.stripe_price_id) {
          // Check if price needs updating (Stripe prices are immutable, so we may need to create a new one)
          try {
            const existingPrice = await stripe.prices.retrieve(
              plan.stripe_price_id
            );
            if (existingPrice.unit_amount !== plan.price * 100) {
              // Create new price if amount changed
              stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: plan.price * 100, // Convert to öre (SEK cents)
                currency: "sek",
                recurring: { interval: "month" },
                metadata: {
                  plan_id: plan.id,
                },
              });

              // Deactivate old price
              await stripe.prices.update(plan.stripe_price_id, {
                active: false,
              });
              console.log(
                `💰 Created new price for ${stripeProduct.name}: ${plan.price} SEK`
              );
            } else {
              stripePrice = existingPrice;
              console.log(`✅ Price up to date for ${stripeProduct.name}`);
            }
          } catch (error) {
            // Price doesn't exist, create new one
            stripePrice = await stripe.prices.create({
              product: stripeProduct.id,
              unit_amount: plan.price * 100,
              currency: "sek",
              recurring: { interval: "month" },
              metadata: {
                plan_id: plan.id,
              },
            });
            console.log(
              `💰 Created price for ${stripeProduct.name}: ${plan.price} SEK`
            );
          }
        } else {
          // Create new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: plan.price * 100,
            currency: "sek",
            recurring: { interval: "month" },
            metadata: {
              plan_id: plan.id,
            },
          });
          console.log(
            `💰 Created price for ${stripeProduct.name}: ${plan.price} SEK`
          );
        }

        // Update database with Stripe IDs
        await dbService.updateMembershipPlanStripeIds(
          plan.id,
          stripeProduct.id,
          stripePrice.id
        );

        console.log(
          `✅ Synced ${plan.title} - Product: ${stripeProduct.id}, Price: ${stripePrice.id}`
        );
      } catch (error) {
        console.error(`❌ Error syncing plan ${plan.title}:`, error);
      }
    }

    console.log("🎉 Stripe product sync completed!");
  }

  // Sync products FROM Stripe TO database (reverse sync)
  async syncProductsFromStripeToDatabase(): Promise<{
    created: number;
    updated: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    console.log("🔄 Starting reverse product sync (Stripe → Database)...");

    const result = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ productId: string; error: string }>,
    };

    try {
      // Hämta alla produkter från Stripe
      const stripeProducts = await stripe.products.list({
        active: true,
        limit: 100,
        expand: ["data.default_price"],
      });

      console.log(`📋 Found ${stripeProducts.data.length} products in Stripe`);

      for (const stripeProduct of stripeProducts.data) {
        try {
          await this.processSingleStripeProduct(stripeProduct, result);
        } catch (error: any) {
          console.error(
            `❌ Error processing product ${stripeProduct.id}:`,
            error
          );
          result.errors.push({
            productId: stripeProduct.id,
            error: error.message,
          });
        }
      }

      console.log(
        `🎉 Reverse product sync completed: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`
      );
      return result;
    } catch (error: any) {
      console.error("❌ Fatal error during reverse product sync:", error);
      throw new Error(`Reverse product sync failed: ${error.message}`);
    }
  }

  private async processSingleStripeProduct(
    stripeProduct: Stripe.Product,
    result: {
      created: number;
      updated: number;
      errors: Array<{ productId: string; error: string }>;
    }
  ): Promise<void> {
    // Kolla om produkten redan finns i databasen
    const existingPlan = await this.findMembershipPlanByStripeProduct(
      stripeProduct.id
    );

    // Hämta default price för produkten
    let defaultPrice: Stripe.Price | null = null;
    if (stripeProduct.default_price) {
      if (typeof stripeProduct.default_price === "string") {
        defaultPrice = await stripe.prices.retrieve(
          stripeProduct.default_price
        );
      } else {
        defaultPrice = stripeProduct.default_price;
      }
    }

    if (!defaultPrice) {
      throw new Error(
        `No default price found for product ${stripeProduct.name}`
      );
    }

    // Konvertera från öre till kronor
    const price = (defaultPrice.unit_amount || 0) / 100;

    // Extrahera credits från metadata eller använd default
    const credits = parseInt(stripeProduct.metadata?.credits || "10");

    const planData = {
      title: stripeProduct.name,
      description: stripeProduct.description || "",
      price: price,
      credits: credits,
      features:
        stripeProduct.features
          ?.map((f) => f.name)
          .filter((name): name is string => name !== undefined) || [],
      popular: false, // Default value
      button_text: "Välj Plan", // Add required button_text
      stripe_product_id: stripeProduct.id,
      stripe_price_id: defaultPrice.id,
      updated_at: new Date().toISOString(),
    };

    if (existingPlan) {
      // Uppdatera befintlig plan
      await dbService.updateMembershipPlan(existingPlan.id, planData);
      result.updated++;
      console.log(`✅ Updated plan: ${stripeProduct.name}`);
    } else {
      // Skapa ny plan
      const newPlan = await dbService.createMembershipPlan({
        ...planData,
        created_at: new Date().toISOString(),
      });
      result.created++;
      console.log(`🆕 Created plan: ${stripeProduct.name}`);
    }
  }

  private async findMembershipPlanByStripeProduct(
    stripeProductId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("stripe_product_id", stripeProductId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `Database error finding membership plan: ${error.message}`
      );
    }

    return data;
  }

  // Get all Stripe products with their prices
  async getAllStripeProducts(): Promise<
    Array<{
      id: string;
      name: string;
      description: string | null;
      metadata: Stripe.Product["metadata"];
      default_price: {
        id: string;
        unit_amount: number | null;
        currency: string;
      } | null;
    }>
  > {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });

    return products.data.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      default_price: product.default_price
        ? {
            id:
              typeof product.default_price === "string"
                ? product.default_price
                : product.default_price.id,
            unit_amount:
              typeof product.default_price === "string"
                ? null
                : product.default_price.unit_amount,
            currency:
              typeof product.default_price === "string"
                ? "sek"
                : product.default_price.currency,
          }
        : null,
    }));
  }

  // Handle webhook events
  /**
   * Handle incoming Stripe webhook events
   * 
   * @param body - The raw request body as a Buffer (REQUIRED for signature verification)
   * @param signature - The Stripe-Signature header value
   * 
   * CRITICAL: The body MUST be the raw, unparsed Buffer from the request.
   * Stripe computes an HMAC signature over the exact bytes received.
   * If the body has been parsed or modified in any way (e.g., by express.json()),
   * the signature verification will fail.
   * 
   * The webhook endpoint must use express.raw({ type: 'application/json' })
   * and be defined BEFORE any express.json() middleware.
   */
  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    // Use local webhook secret for development, production secret for production
    const webhookSecret =
      process.env.NODE_ENV === "production"
        ? process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION
        : process.env.STRIPE_WEBHOOK_SECRET_LOCAL;

    if (!webhookSecret) {
      throw new Error(
        `Webhook secret not configured for ${process.env.NODE_ENV} environment`
      );
    }

    // Verify the webhook signature and construct the event
    // This will throw StripeSignatureVerificationError if verification fails
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`🔔 Webhook received: ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
        await this.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "subscription_schedule.canceled":
        await this.handleSubscriptionScheduleCanceled(
          event.data.object as Stripe.SubscriptionSchedule
        );
        break;

      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "setup_intent.succeeded":
        await this.handleSetupIntentSucceeded(
          event.data.object as Stripe.SetupIntent
        );
        break;

      case "setup_intent.setup_failed":
        await this.handleSetupIntentFailed(
          event.data.object as Stripe.SetupIntent
        );
        break;

      case "payment_method.attached":
        await this.handlePaymentMethodAttached(
          event.data.object as Stripe.PaymentMethod
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    console.log("📝 Processing subscription created:", subscription.id);
    
    // Use centralized sync for consistency
    await this.syncSubscriptionToDatabase(subscription);
  }

  /**
   * CRITICAL: Handle subscription updates from Stripe webhooks
   * 
   * THIS IS THE SINGLE SOURCE OF TRUTH FOR SUBSCRIPTION STATE
   * 
   * WHY PRICE-BASED SYNCING IS REQUIRED:
   * When a scheduled subscription change is applied early via Stripe Dashboard ("Apply now"),
   * or when a subscription is manually changed in Stripe Console,
   * Stripe emits customer.subscription.updated but ONLY changes subscription.items[0].price.id.
   * The status often remains the same (e.g., "active"), and billing periods may not change.
   * 
   * We MUST sync based on price.id to catch these immediate plan changes, otherwise
   * the database will show stale plan/credits while Stripe has already switched the user.
   * 
   * ARCHITECTURE PRINCIPLE:
   * - Stripe is authoritative
   * - Database is read-only projection
   * - All subscription state changes confirmed via webhooks
   * - Never update subscription state directly in database outside webhooks
   * 
   * This treats customer.subscription.updated as the single source of truth.
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    console.log("🔄 Processing subscription updated:", subscription.id);
    console.log("   Status:", subscription.status);
    console.log("   Has schedule:", subscription.schedule ? "Yes" : "No");
    console.log("   current_period_start:", subscription.current_period_start);
    console.log("   current_period_end:", subscription.current_period_end);
    
    // If subscription object is incomplete (missing period dates), fetch full object from Stripe
    if (!subscription.current_period_start || !subscription.current_period_end) {
      console.log("⚠️ Webhook subscription object incomplete, fetching full subscription from Stripe...");
      try {
        const fullSubscription = await stripe.subscriptions.retrieve(subscription.id);
        console.log("   ✓ Full subscription retrieved");
        console.log("   current_period_start:", fullSubscription.current_period_start);
        console.log("   current_period_end:", fullSubscription.current_period_end);
        subscription = fullSubscription;
      } catch (error) {
        console.error("❌ Failed to retrieve full subscription:", error);
        throw error;
      }
    }
    
    console.log("   This is the AUTHORITATIVE subscription state from Stripe");
    
    // Use centralized sync - it handles all the logic
    await this.syncSubscriptionToDatabase(subscription);
  }

  /**
   * Centralized helper to sync any Stripe subscription to database
   * 
   * ARCHITECTURE: Database as Read-Only Projection
   * 
   * This function is the ONLY place where subscription-related database state
   * should be updated (except for non-subscription metadata like credits_used).
   * 
   * This function is idempotent - safe to call multiple times with same data.
   * It's the single source of truth for mapping Stripe subscriptions to our database.
   * 
   * Updates (in order):
   * 1. subscriptions table (status, periods, price_id) - Stripe state
   * 2. memberships table (plan_id, credits, price_id) - Derived from Stripe
   * 
   * CRITICAL: Always sync based on subscription.items[0].price.id
   * - DO NOT rely on status changes (may stay "active")
   * - DO NOT rely on period changes (may stay same)
   * - DO NOT rely on invoice events
   * - Price ID is the authoritative source for plan changes
   */
  /**
   * Public method to manually sync a subscription from Stripe to database
   */
  public async syncSubscription(subscription: Stripe.Subscription): Promise<void> {
    return this.syncSubscriptionToDatabase(subscription);
  }

  private async syncSubscriptionToDatabase(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      console.warn("⚠️ Subscription without price ID, skipping sync:", subscription.id);
      return;
    }

    console.log(`💾 Syncing subscription ${subscription.id} with price ${priceId}`);
    console.log(`   Source: Stripe webhook (authoritative)`);

    try {
      // Helper to safely parse Stripe timestamps
      const parseStripeTimestamp = (timestamp: number | null | undefined): string | undefined => {
        if (!timestamp || timestamp <= 0) return undefined;
        try {
          const date = new Date(timestamp * 1000);
          if (isNaN(date.getTime())) return undefined;
          return date.toISOString();
        } catch {
          return undefined;
        }
      };

      // Step 1: Update or create subscriptions table entry with Stripe state
      const existingSubscription = await dbService.getSubscriptionByStripeId(subscription.id);
      
      const periodStart = parseStripeTimestamp(subscription.current_period_start);
      const periodEnd = parseStripeTimestamp(subscription.current_period_end);

      if (!periodStart || !periodEnd) {
        console.error(`❌ Invalid timestamps for subscription ${subscription.id}`);
        console.error(`   current_period_start:`, subscription.current_period_start);
        console.error(`   current_period_end:`, subscription.current_period_end);
        console.error(`   subscription status:`, subscription.status);
        console.error(`   Full subscription object keys:`, Object.keys(subscription));
        
        // If subscription is incomplete/trialing without periods, skip sync for now
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          console.warn(`⚠️ Skipping sync for incomplete subscription ${subscription.id}`);
          return;
        }
        
        throw new Error('Invalid time value in subscription timestamps');
      }
      
      // Step 1: Find the membership plan by stripe_price_id
      const plan = await this.findMembershipPlanByStripePrice(priceId);
      
      if (!plan) {
        console.warn(`⚠️ No membership plan found for price ${priceId}, skipping sync`);
        console.warn(`   Database state may be incomplete until plan is configured`);
        return;
      }

      // Get user ID from subscription metadata
      const userId = subscription.metadata?.user_id;
      if (!userId) {
        console.error(`❌ Cannot sync membership - no user_id in subscription metadata`);
        return;
      }

      // Step 2: CRITICAL - Check if user already has ANY active membership (by user_id)
      // This prevents duplicates when scheduling plan changes creates new subscription ID
      const { data: existingUserMemberships } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      // Step 3: Check if membership already exists for this specific subscription ID
      const existingMembership = await dbService.getMembershipBySubscriptionId(subscription.id);
      
      if (existingMembership) {
        // Membership exists for this exact subscription ID - update it
        const planChanged = existingMembership.plan_id !== plan.id || 
                           existingMembership.stripe_price_id !== priceId;

        if (planChanged) {
          console.log(`📋 Plan change detected: ${existingMembership.plan_type} → ${plan.title}`);
          console.log(`   Old credits: ${existingMembership.credits}, New credits: ${plan.credits}`);
          
          await dbService.updateMembershipBySubscriptionId(subscription.id, {
            plan_id: plan.id,
            plan_type: plan.title,
            credits: plan.credits,
            stripe_price_id: priceId,
            stripe_status: subscription.status,
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          });
          console.log(`   ✓ Membership updated with new plan`);
        } else {
          console.log(`✓ Subscription ${subscription.id} already synced with plan ${plan.title}`);
          console.log(`  (Idempotent check - no changes needed)`);
        }
      } else if (existingUserMemberships && existingUserMemberships.length > 0) {
        // User has existing membership but with DIFFERENT subscription ID
        // This happens when Stripe creates new subscription for scheduled changes
        // UPDATE the existing membership instead of creating a duplicate
        const existingUserMembership = existingUserMemberships[0];
        
        // Get customer ID
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        // Update membership with new subscription details
        // Using direct Supabase update to change subscription_id
        const { error: updateError } = await supabase
          .from("memberships")
          .update({
            plan_id: plan.id,
            plan_type: plan.title,
            credits: plan.credits,
            stripe_subscription_id: subscription.id, // Update to new subscription ID
            stripe_price_id: priceId,
            stripe_status: subscription.status,
            stripe_customer_id: customerId,
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            is_active: subscription.status === 'active' || subscription.status === 'trialing',
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUserMembership.id);

        if (updateError) {
          console.error(`❌ Failed to update existing membership:`, updateError);
          throw updateError;
        }
      } else {
        // NEW USER - No existing membership found, create new one

        // Get customer ID
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer?.id;

        if (!customerId) {
          console.error(`❌ Cannot create membership - no customer ID in subscription`);
          return;
        }

        // Create new membership
        await dbService.createMembership({
          user_id: userId,
          plan_id: plan.id,
          plan_type: plan.title,
          credits: plan.credits,
          credits_used: 0,
          is_active: subscription.status === 'active' || subscription.status === 'trialing',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          stripe_status: subscription.status,
          start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
        });
        
        console.log(`   ✓ Membership created for user ${userId} with plan ${plan.title}`);
      }

      console.log(`✅ Successfully synced subscription ${subscription.id} from Stripe`);
    } catch (error: any) {
      console.error(`❌ Error syncing subscription ${subscription.id}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    console.log("📝 Processing subscription deleted:", subscription.id);

    await dbService.updateSubscription(subscription.id, {
      status: "canceled",
      canceled_at: new Date().toISOString(),
    });
  }

  /**
   * Handle subscription schedule cancellation
   * 
   * This is emitted when:
   * 1. A scheduled change is canceled via API/Dashboard
   * 2. A scheduled change is applied early ("Apply now" in Dashboard)
   * 
   * We mark the scheduled change as canceled in our database.
   */
  private async handleSubscriptionScheduleCanceled(
    schedule: Stripe.SubscriptionSchedule
  ): Promise<void> {
    console.log("📅 Processing subscription schedule canceled:", schedule.id);
    // With Stripe-native scheduling, no database tracking needed
    // Stripe manages the schedule lifecycle automatically
    console.log(`ℹ️ Schedule ${schedule.id} canceled - Stripe manages lifecycle`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log("💰 Payment succeeded for invoice:", invoice.id);

    if (invoice.subscription) {
      const subscription = await dbService.getSubscriptionByStripeId(
        invoice.subscription as string
      );
      if (subscription) {
        // Update membership credits or extend subscription
        // This is where you'd implement your business logic
        console.log("✅ Payment processed for subscription:", subscription.id);
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log("❌ Payment failed for invoice:", invoice.id);

    if (invoice.subscription) {
      const subscription = await dbService.getSubscriptionByStripeId(
        invoice.subscription as string
      );
      if (subscription) {
        // Handle failed payment - maybe send notification
        console.log("⚠️ Payment failed for subscription:", subscription.id);
      }
    }
  }

  private async handleSetupIntentSucceeded(
    setupIntent: Stripe.SetupIntent
  ): Promise<void> {
    console.log("✅ Setup intent succeeded:", setupIntent.id);

    if (setupIntent.customer && setupIntent.payment_method) {
      const customerId =
        typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer.id;

      const paymentMethodId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;

      console.log(
        "💳 Payment method",
        paymentMethodId,
        "successfully attached to customer",
        customerId
      );

      // Check if this is the first payment method for the customer
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
        });

        console.log(
          `🔍 Customer ${customerId} now has ${paymentMethods.data.length} payment method(s)`
        );

        // If this is the first payment method, make it the default
        if (paymentMethods.data.length === 1) {
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
          console.log("✅ Set payment method as default for customer");
        }

        // Update payment method metadata to mark as user-added
        await stripe.paymentMethods.update(paymentMethodId, {
          metadata: {
            user_added: "true",
            created_via: "fitpass_app",
            added_at: new Date().toISOString(),
          },
        });
        console.log("✅ Updated payment method metadata");
      } catch (error) {
        console.error("⚠️ Error processing setup intent success:", error);
      }
    }
  }

  private async handleSetupIntentFailed(
    setupIntent: Stripe.SetupIntent
  ): Promise<void> {
    console.log("❌ Setup intent failed:", setupIntent.id);

    if (setupIntent.last_setup_error) {
      console.log("❌ Setup error:", setupIntent.last_setup_error.message);
    }
  }

  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    console.log(
      "💳 Payment method attached:",
      paymentMethod.id,
      "to customer:",
      paymentMethod.customer
    );

    // This event fires when a payment method is attached to a customer
    // The setup_intent.succeeded event is more reliable for user-initiated additions
  }

  // Sync all subscriptions from Stripe to local database
  async syncSubscriptionsFromStripe(): Promise<{
    created: number;
    updated: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    console.log("🔄 Starting comprehensive subscription sync from Stripe...");

    const result = {
      created: 0,
      updated: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    try {
      // Get all subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        status: "all",
        limit: 100,
        expand: [
          "data.customer",
          "data.items.data.price",
          "data.latest_invoice",
        ],
      });

      console.log(
        `📋 Found ${subscriptions.data.length} subscriptions in Stripe`
      );

      for (const stripeSubscription of subscriptions.data) {
        try {
          await this.processSingleSubscriptionComplete(
            stripeSubscription,
            result
          );
        } catch (error: any) {
          console.error(
            `❌ Error processing subscription ${stripeSubscription.id}:`,
            error
          );
          result.errors.push({
            subscriptionId: stripeSubscription.id,
            error: error.message,
          });
        }
      }

      console.log(
        `🎉 Comprehensive subscription sync completed: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`
      );
      return result;
    } catch (error: any) {
      console.error("❌ Fatal error during subscription sync:", error);
      throw new Error(`Subscription sync failed: ${error.message}`);
    }
  }

  private async processSingleSubscriptionComplete(
    stripeSubscription: Stripe.Subscription,
    result: {
      created: number;
      updated: number;
      errors: Array<{ subscriptionId: string; error: string }>;
    }
  ): Promise<void> {
    const customerId =
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id;

    if (!customerId) {
      throw new Error("No customer ID found for subscription");
    }

    // Find user by stripe_customer_id
    const user = await this.findUserByStripeCustomerId(customerId);
    if (!user) {
      console.log(
        `⚠️ No user found for Stripe customer ID: ${customerId}, skipping...`
      );
      return;
    }

    // Get price_id from subscription items
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new Error("No price ID found in subscription items");
    }

    // Find corresponding membership plan
    const membershipPlan = await this.findMembershipPlanByStripePrice(priceId);
    if (!membershipPlan) {
      console.log(
        `⚠️ No membership plan found for Stripe price ID: ${priceId}, skipping...`
      );
      return;
    }

    // Calculate dates and trial information
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);
    const isActive = ["active", "trialing", "past_due"].includes(
      stripeSubscription.status
    );

    // Check if subscription has trial
    const hasTrialPeriod =
      stripeSubscription.trial_start && stripeSubscription.trial_end;
    const trialEndDate = hasTrialPeriod
      ? new Date(stripeSubscription.trial_end! * 1000)
      : null;
    const isInTrial = stripeSubscription.status === "trialing";

    // Calculate trial days remaining
    let trialDaysRemaining = null;
    if (isInTrial && trialEndDate) {
      const now = new Date();
      const timeDiff = trialEndDate.getTime() - now.getTime();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(timeDiff / (1000 * 3600 * 24))
      );
    }

    // Check if membership already exists
    const existingMembership = await this.findExistingMembershipBySubscription(
      stripeSubscription.id
    );

    // Prepare comprehensive membership data
    const membershipData = {
      user_id: user.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      // Preserve existing credits_used if updating, otherwise start with 0
      credits_used: existingMembership?.credits_used || 0,
      has_used_trial:
        hasTrialPeriod || existingMembership?.has_used_trial || false,
      trial_end_date: trialEndDate?.toISOString() || undefined,
      trial_days_remaining: trialDaysRemaining || undefined,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: isActive,
      plan_id: membershipPlan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      stripe_status: stripeSubscription.status,
      updated_at: new Date().toISOString(),
    };

    console.log(`📝 Processing membership for user ${user.id}:`, {
      plan_type: membershipData.plan_type,
      stripe_status: membershipData.stripe_status,
      is_active: membershipData.is_active,
      has_trial: hasTrialPeriod,
      trial_days_remaining: trialDaysRemaining,
    });

    if (existingMembership) {
      // Update existing membership with all Stripe data
      await dbService.updateMembership(existingMembership.id, membershipData);
      result.updated++;
      console.log(
        `✅ Updated membership for user ${user.id} (${membershipData.plan_type})`
      );
    } else {
      // Create new membership with complete data
      await dbService.createMembership({
        ...membershipData,
        created_at: new Date().toISOString(),
      });
      result.created++;
      console.log(
        `🆕 Created membership for user ${user.id} (${membershipData.plan_type})`
      );
    }
  }

  private async findExistingMembershipBySubscription(
    stripeSubscriptionId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `Database error finding existing membership: ${error.message}`
      );
    }

    return data;
  }

  private async processSingleSubscription(
    stripeSubscription: Stripe.Subscription,
    result: {
      created: number;
      updated: number;
      errors: Array<{ subscriptionId: string; error: string }>;
    }
  ): Promise<void> {
    const customerId =
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id;

    if (!customerId) {
      throw new Error("No customer ID found for subscription");
    }

    // Hitta användaren via stripe_customer_id
    const user = await this.findUserByStripeCustomerId(customerId);
    if (!user) {
      throw new Error(`No user found for Stripe customer ID: ${customerId}`);
    }

    // Hämta första price_id från subscription items
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    if (!priceId) {
      throw new Error("No price ID found in subscription items");
    }

    // Hitta motsvarande membership plan
    const membershipPlan = await this.findMembershipPlanByStripePrice(priceId);
    if (!membershipPlan) {
      throw new Error(
        `No membership plan found for Stripe price ID: ${priceId}`
      );
    }

    // Beräkna datum
    const startDate = new Date(stripeSubscription.current_period_start * 1000);
    const endDate = new Date(stripeSubscription.current_period_end * 1000);
    const isActive = ["active", "trialing"].includes(stripeSubscription.status);

    // Kolla om medlemskap redan finns
    const existingMembership = await this.findExistingMembership(
      user.id,
      stripeSubscription.id
    );

    const membershipData = {
      user_id: user.id,
      plan_type: membershipPlan.title,
      credits: membershipPlan.credits,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: isActive,
      plan_id: membershipPlan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      stripe_status: stripeSubscription.status,
      updated_at: new Date().toISOString(),
    };

    if (existingMembership) {
      // Uppdatera befintligt medlemskap
      await dbService.updateMembership(existingMembership.id, membershipData);
      result.updated++;
      console.log(`✅ Updated membership for user ${user.id}`);
    } else {
      // Skapa nytt medlemskap
      await dbService.createMembership({
        ...membershipData,
        credits_used: 0,
        has_used_trial: false,
        created_at: new Date().toISOString(),
      });
      result.created++;
      console.log(`🆕 Created membership for user ${user.id}`);
    }
  }

  private async findUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Database error finding user: ${error.message}`);
    }

    return data ? { id: data.user_id } : null;
  }

  private async findMembershipPlanByStripePrice(
    stripePriceId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("stripe_price_id", stripePriceId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `Database error finding membership plan: ${error.message}`
      );
    }

    return data;
  }

  private async findExistingMembership(
    userId: string,
    stripeSubscriptionId: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `Database error finding existing membership: ${error.message}`
      );
    }

    return data;
  }

  async calculatePaymentCuts(
    plan: any,
    gymVisits: Array<{ gym_id: string; visit_count: number }>
  ): Promise<{
    gymCuts: Array<{ gym_id: string; amount: number; visits?: number }>;
    fitpassRevenue: number;
    totalGymCut: number;
    gymCount: number;
  }> {
    const planType = plan.type || "tiered";
    const gymCuts: Array<{ gym_id: string; amount: number; visits?: number }> =
      [];
    let totalGymCut = 0;

    if (planType === "tiered") {
      // Tiered plans: gym gets paid per pass used
      const perPassCut = plan.per_pass_gym_cut || 80; // Default 80 SEK per pass

      for (const visit of gymVisits) {
        const gymCutAmount = visit.visit_count * perPassCut;
        gymCuts.push({
          gym_id: visit.gym_id,
          amount: gymCutAmount,
          visits: visit.visit_count,
        });
        totalGymCut += gymCutAmount;
      }
    } else if (planType === "unlimited") {
      // Unlimited plans: gym gets a flat rate based on gym count
      const unlimitedCuts = plan.unlimited_gym_cuts || {
        "1": 650,
        "2": 500,
        "3": 395,
      };

      // Get unique gym count
      const uniqueGyms = new Set(gymVisits.map((v) => v.gym_id));
      const gymCount = uniqueGyms.size;
      const cutPerGym =
        unlimitedCuts[gymCount.toString()] || unlimitedCuts["3"]; // Default to 3+ gym rate

      for (const gymId of uniqueGyms) {
        gymCuts.push({
          gym_id: gymId,
          amount: cutPerGym,
        });
        totalGymCut += cutPerGym;
      }
    }

    const fitpassRevenue = plan.price - totalGymCut;

    return {
      gymCuts,
      fitpassRevenue,
      totalGymCut,
      gymCount: new Set(gymVisits.map((v) => v.gym_id)).size,
    };
  }

  async createPaymentIntent(params: {
    customerId: string;
    amount: number;
    currency: string;
    planId: string;
    userId: string;
    cutCalculation: any;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        customer: params.customerId,
        amount: params.amount * 100, // Convert to cents/öre
        currency: params.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          plan_id: params.planId,
          user_id: params.userId,
          fitpass_revenue: params.cutCalculation.fitpassRevenue.toString(),
          total_gym_cut: params.cutCalculation.totalGymCut.toString(),
          gym_count: params.cutCalculation.gymCount.toString(),
        },
      });

      console.log("✅ Payment intent created:", {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });

      return paymentIntent;
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Create gym transfers for unlimited plans (Stripe Connect)
   */
  async createGymTransfers(payment: any): Promise<void> {
    try {
      if (!payment.gym_cuts || payment.gym_cuts.length === 0) {
        console.log("No gym cuts to process for payment:", payment.id);
        return;
      }

      console.log("💸 Creating gym transfers for payment:", payment.id);

      for (const gymCut of payment.gym_cuts) {
        // Get gym's Stripe Connect account
        const { data: gym, error } = await supabase
          .from("clubs")
          .select("stripe_account_id, name")
          .eq("id", gymCut.gym_id)
          .single();

        if (error || !gym?.stripe_account_id) {
          console.error(
            `❌ Gym ${gymCut.gym_id} does not have Stripe Connect account`
          );
          continue;
        }

        // Create transfer to gym
        const transfer = await stripe.transfers.create({
          amount: Math.round(gymCut.amount * 100), // Convert to öre
          currency: "sek",
          destination: gym.stripe_account_id,
          metadata: {
            payment_log_id: payment.id,
            gym_id: gymCut.gym_id,
            gym_name: gym.name,
            user_id: payment.user_id,
            plan_id: payment.plan_id,
          },
        });

        // Log the transfer
        await supabase.from("gym_transfer_logs").insert({
          payment_log_id: payment.id,
          gym_id: gymCut.gym_id,
          stripe_transfer_id: transfer.id,
          amount: gymCut.amount,
          currency: "sek",
          status: "completed",
          metadata: {
            gym_name: gym.name,
            visits: gymCut.visits,
          },
        });

        console.log(`✅ Transfer created for gym ${gym.name}:`, {
          transfer_id: transfer.id,
          amount: gymCut.amount,
        });
      }
    } catch (error: any) {
      console.error("❌ Error creating gym transfers:", error);
      // Don't throw - we don't want to fail the payment if transfers fail
      // They can be retried later
    }
  }
}

export const stripeService = new StripeService();
