/**
 * Subscription Status API
 * 
 * Provides real-time subscription status for optimistic UI updates
 */

import { Request, Response, Router } from "express";
import { dbService } from "../../services/database";
import { stripe } from "../../services/stripe";

const router = Router();

/**
 * Get subscription sync status
 * 
 * Compares Stripe state with database state to detect pending updates.
 * Useful for showing "Syncing..." state in UI while waiting for webhooks.
 * 
 * Returns:
 * - synced: true if DB matches Stripe
 * - pending: true if webhook update is expected
 * - stripeState: Current state from Stripe (authoritative)
 * - dbState: Current state in database (projection)
 */
router.get("/subscription/:subscriptionId/status", async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    // Fetch current state from Stripe (authoritative source)
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price']
    });

    const stripePriceId = stripeSubscription.items.data[0]?.price?.id;

    // Fetch current state from database (projection)
    const dbSubscription = await dbService.getSubscriptionByStripeId(subscriptionId);
    const dbMembership = await dbService.getMembershipBySubscriptionId(subscriptionId);

    // Check if states match
    const priceMatches = dbSubscription?.stripe_price_id === stripePriceId;
    const statusMatches = dbSubscription?.status === stripeSubscription.status;
    const membershipPriceMatches = dbMembership?.stripe_price_id === stripePriceId;

    const isSynced = priceMatches && statusMatches && membershipPriceMatches;

    res.json({
      success: true,
      synced: isSynced,
      pending: !isSynced,
      stripeState: {
        subscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        priceId: stripePriceId,
        currentPeriodEnd: stripeSubscription.current_period_end,
      },
      dbState: {
        subscriptionStatus: dbSubscription?.status,
        subscriptionPriceId: dbSubscription?.stripe_price_id,
        membershipPlanType: dbMembership?.plan_type,
        membershipCredits: dbMembership?.credits,
        membershipPriceId: dbMembership?.stripe_price_id,
      },
      differences: isSynced ? null : {
        priceIdMismatch: !priceMatches,
        statusMismatch: !statusMatches,
        membershipPriceMismatch: !membershipPriceMatches,
      },
      message: isSynced 
        ? "Database is in sync with Stripe" 
        : "Webhook sync pending - changes will appear shortly"
    });

  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Poll for sync completion
 * 
 * Useful for optimistic UI - call this after making changes in Stripe
 * to wait for webhook confirmation.
 * 
 * Query params:
 * - timeout: Max wait time in seconds (default: 10)
 * - interval: Check interval in ms (default: 500)
 */
router.get("/subscription/:subscriptionId/wait-for-sync", async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const timeout = parseInt(req.query.timeout as string) || 10; // seconds
    const interval = parseInt(req.query.interval as string) || 500; // ms
    
    const startTime = Date.now();
    const maxWait = timeout * 1000;

    // Poll until synced or timeout
    while (Date.now() - startTime < maxWait) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const stripePriceId = stripeSubscription.items.data[0]?.price?.id;
      
      const dbMembership = await dbService.getMembershipBySubscriptionId(subscriptionId);
      
      if (dbMembership?.stripe_price_id === stripePriceId) {
        // Synced!
        return res.json({
          success: true,
          synced: true,
          waitedMs: Date.now() - startTime,
          membership: {
            planType: dbMembership.plan_type,
            credits: dbMembership.credits,
            stripeStatus: dbMembership.stripe_status,
          },
          message: "Database synced with Stripe"
        });
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Timeout
    res.status(408).json({
      success: false,
      synced: false,
      waitedMs: Date.now() - startTime,
      message: "Timeout waiting for webhook sync. Changes may still be processing.",
      suggestion: "Try polling /subscription/:id/status endpoint"
    });

  } catch (error: any) {
    console.error("Error waiting for sync:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
