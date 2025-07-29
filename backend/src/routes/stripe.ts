import { Request, Response, Router } from 'express';
import { dbService } from '../services/database';
import { stripeService } from '../services/stripe';

const router = Router();

// Create Stripe customer
router.post('/create-customer', async (req: Request, res: Response) => {
  try {
    const { email, name, userId } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const customerId = await stripeService.createOrGetCustomer(email, name, userId);

    res.json({ customerId });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { customerId, priceId, userId, membershipPlanId } = req.body;

    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and price ID are required' });
    }

    // Create Stripe subscription
    const stripeSubscription = await stripeService.createSubscription(customerId, priceId);

    // Create database subscription record
    if (userId && membershipPlanId) {
      await dbService.createSubscription({
        user_id: userId,
        membership_plan_id: membershipPlanId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: customerId,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      });

      // Update user's membership
      await dbService.updateUserMembership(userId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscription.id,
        subscription_status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      });
    }

    res.json(stripeSubscription);
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
router.post('/update-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId, newPriceId } = req.body;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ error: 'Subscription ID and new price ID are required' });
    }

    const updatedSubscription = await stripeService.updateSubscription(subscriptionId, newPriceId);

    // Update database
    await dbService.updateSubscription(subscriptionId, {
      status: updatedSubscription.status,
      current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    });

    res.json(updatedSubscription);
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const canceledSubscription = await stripeService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

    // Update database
    await dbService.updateSubscription(subscriptionId, {
      status: canceledSubscription.status,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end,
      canceled_at: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000).toISOString() : undefined,
    });

    res.json(canceledSubscription);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync products with Stripe
router.post('/sync-products', async (req: Request, res: Response) => {
  try {
    await stripeService.syncProductsWithDatabase();
    res.json({ message: 'Products synced successfully' });
  } catch (error: any) {
    console.error('Error syncing products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get membership plans with Stripe data
router.get('/membership-plans', async (req: Request, res: Response) => {
  try {
    const plans = await dbService.getMembershipPlans();
    res.json(plans);
  } catch (error: any) {
    console.error('Error getting membership plans:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
