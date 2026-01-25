import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../../services/database';
import { stripe } from '../../services/stripe';

const router: Router = Router() as Router;

/**
 * POST /api/stripe/webhook/connect
 * Handle Stripe Connect account.updated webhooks
 */
router.post('/webhook/connect', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({
      error: 'Missing signature or webhook secret',
    });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret);

    console.log('Received Stripe webhook event:', event.type);

    // Handle account.updated event
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;

      // Determine KYC status based on account requirements
      let kycStatus: 'verified' | 'pending' | 'needs_input' = 'pending';

      if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
        kycStatus = 'needs_input';
      } else if (
        account.requirements?.eventually_due &&
        account.requirements.eventually_due.length > 0
      ) {
        kycStatus = 'pending';
      } else if (account.charges_enabled && account.payouts_enabled) {
        kycStatus = 'verified';
      }

      // Determine if onboarding is complete
      const onboardingComplete =
        account.charges_enabled &&
        account.payouts_enabled &&
        (!account.requirements?.currently_due || account.requirements.currently_due.length === 0);

      // Update club in database
      const { error } = await supabase
        .from('clubs')
        .update({
          payouts_enabled: account.payouts_enabled || false,
          kyc_status: kycStatus,
          stripe_onboarding_complete: onboardingComplete,
        })
        .eq('stripe_account_id', account.id);

      if (error) {
        console.error('Error updating club:', error);
        throw error;
      }

      console.log(`Updated club for account ${account.id}:`, {
        payouts_enabled: account.payouts_enabled,
        kyc_status: kycStatus,
        stripe_onboarding_complete: onboardingComplete,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook handler failed',
    });
  }
});

export default router;
