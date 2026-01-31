import { Request, Response, Router } from 'express';
import { paymentRateLimiter } from '../../middleware/rateLimiter';
import { supabase } from '../../services/database';
import { stripeService } from '../../services/stripe';

const router: Router = Router();

/**
 * Create a payment for a subscription
 * POST /api/stripe/user/:userId/payment
 */
router.post('/user/:userId/payment', paymentRateLimiter, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { planId, gymVisits } = req.body;

    console.log('💳 Creating payment:', { userId: userId.slice(0, 8), planId, gymVisits });

    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, planId',
      });
    }

    // Get user profile and membership plan
    const [profileResult, planResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('stripe_customer_id, first_name, last_name')
        .eq('id', userId)
        .single(),
      supabase.from('membership_plans').select('*').eq('id', planId).single(),
    ]);

    if (profileResult.error || !profileResult.data) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
      });
    }

    if (planResult.error || !planResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Membership plan not found',
      });
    }

    const profile = profileResult.data;
    const plan = planResult.data;

    // Ensure user has a Stripe customer
    if (!profile.stripe_customer_id) {
      return res.status(400).json({
        success: false,
        error: 'User does not have a Stripe customer ID',
      });
    }

    // Calculate payment cuts based on plan type
    const cutCalculation = await stripeService.calculatePaymentCuts(plan, gymVisits || []);

    console.log('💰 Cut calculation:', cutCalculation);

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      customerId: profile.stripe_customer_id,
      amount: plan.price,
      currency: 'sek',
      planId: plan.id,
      userId: userId,
      cutCalculation: cutCalculation,
    });

    // Log the payment
    const { error: logError } = await supabase.from('payment_logs').insert({
      user_id: userId,
      plan_id: plan.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: plan.price,
      currency: 'sek',
      status: 'pending',
      gym_cuts: cutCalculation.gymCuts,
      fitpass_revenue: cutCalculation.fitpassRevenue,
      metadata: {
        gym_count: cutCalculation.gymCount,
        plan_type: plan.type || 'tiered',
        gym_visits: gymVisits,
      },
    });

    if (logError) {
      console.error('Error logging payment:', logError);
    }

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
      cutCalculation: cutCalculation,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment',
    });
  }
});

/**
 * Get payment history for a user
 * GET /api/stripe/user/:userId/payments
 */
router.get('/user/:userId/payments', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    console.log('📜 Fetching payment history:', { userId: userId.slice(0, 8) });

    const { data: payments, error } = await supabase
      .from('payment_logs')
      .select(
        `
        *,
        membership_plans (
          id,
          title,
          type,
          price
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      payments: payments || [],
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment history',
    });
  }
});

/**
 * Update payment status (typically called by webhook)
 * PUT /api/stripe/payment/:paymentIntentId/status
 */
router.put('/payment/:paymentIntentId/status', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    const { status } = req.body;

    console.log('🔄 Updating payment status:', { paymentIntentId, status });

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: status',
      });
    }

    const { data: payment, error } = await supabase
      .from('payment_logs')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If payment succeeded and it's an unlimited plan, create gym transfers
    if (status === 'succeeded' && payment.gym_cuts) {
      await stripeService.createGymTransfers(payment);
    }

    return res.status(200).json({
      success: true,
      payment: payment,
    });
  } catch (error: any) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update payment status',
    });
  }
});

/**
 * Get cut configuration
 * GET /api/stripe/cut-config
 */
router.get('/cut-config', async (req: Request, res: Response) => {
  try {
    const { data: config, error } = await supabase
      .from('payment_cut_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Ignore "no rows" error
      throw error;
    }

    return res.status(200).json({
      success: true,
      config: config || {
        tiered_per_pass_cut: 80,
        unlimited_gym_cuts: {
          '1': 650,
          '2': 500,
          '3': 395,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching cut config:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cut config',
    });
  }
});

export default router;
