import { Request, Response, Router } from 'express';
import { dbService, supabase } from '../services/database';
import { stripe, stripeService } from '../services/stripe';

const router = Router();

// Debug route to test if routes are working
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Stripe routes are working!', timestamp: new Date().toISOString() });
});

// Create Stripe customer - Keep for StripeService compatibility
router.post('/create-customer', async (req: Request, res: Response) => {
  try {
    console.log('🔍 /create-customer endpoint called with:', req.body);
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

// UNIFIED SUBSCRIPTION MANAGEMENT - handles create, update, and change plans
router.post('/manage-subscription', async (req: Request, res: Response) => {
  try {
    console.log('🔍 /manage-subscription endpoint called with:', req.body);
    const { userId, stripePriceId } = req.body;

    console.log('🚀 ===== MANAGE SUBSCRIPTION START =====');
    console.log('📝 Request:', { userId, stripePriceId });

    if (!userId || !stripePriceId) {
      return res.status(400).json({ error: 'User ID and Stripe price ID are required' });
    }

    // 1. Get membership plan
    const membershipPlan = await dbService.getMembershipPlanByStripePrice(stripePriceId);
    if (!membershipPlan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }
    console.log('✅ Plan found:', membershipPlan.title);

    // 2. Get user profile
    const userProfile = await dbService.getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // 3. Get or create Stripe customer
    const stripeCustomerId = await stripeService.createOrGetCustomer(
      userProfile.email || `user+${userId}@fitpass.com`,
      userProfile.display_name || userProfile.full_name || 'FitPass User',
      userId
    );
    console.log('✅ Stripe customer:', stripeCustomerId);

    // 4. Check existing membership
    const existingMembership = await dbService.getUserActiveMembership(userId);

    if (existingMembership) {
      console.log('📄 Found existing membership');
      
      // Same plan - return existing
      if (existingMembership.plan_id === membershipPlan.id && existingMembership.stripe_subscription_id) {
        console.log('✅ User already has this plan');
        return res.json({
          subscription_id: existingMembership.stripe_subscription_id,
          status: existingMembership.stripe_status || 'active',
          message: 'User already has this plan'
        });
      }

      // Different plan or no Stripe subscription - handle update
      if (existingMembership.stripe_subscription_id) {
        console.log('🔄 Updating existing subscription...');
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
            start_date: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
            end_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          });
          
          console.log('✅ Subscription updated successfully');
          return res.json(updatedSubscription);
          
        } catch (updateError: any) {
          console.log('⚠️ Update failed, creating new subscription:', updateError.message);
          
          // If update fails (e.g., incomplete subscription), cancel and create new
          try {
            await stripeService.cancelSubscription(existingMembership.stripe_subscription_id, false);
            console.log('✅ Cancelled old subscription');
          } catch (cancelError) {
            console.log('⚠️ Failed to cancel old subscription:', cancelError);
          }
        }
      }
      
      // Create new subscription and update existing membership
      console.log('🆕 Creating new subscription for existing membership...');
      const newSubscription = await stripeService.createSubscription(stripeCustomerId, stripePriceId);
      
      console.log('📝 About to update membership with data:', {
        membershipId: existingMembership.id,
        plan_id: membershipPlan.id,
        plan_title: membershipPlan.title,
        plan_credits: membershipPlan.credits,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: newSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: newSubscription.status
      });

      const updatedMembership = await dbService.updateMembership(existingMembership.id, {
        plan_id: membershipPlan.id,
        plan_type: membershipPlan.title,
        credits: membershipPlan.credits,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: newSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: newSubscription.status,
        start_date: new Date(newSubscription.current_period_start * 1000).toISOString(),
        end_date: new Date(newSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Existing membership updated with new subscription');
      console.log('📊 Updated membership result:', JSON.stringify(updatedMembership, null, 2));
      
      // Verify the update by fetching the membership again
      const verifyMembership = await dbService.getUserActiveMembership(userId);
      console.log('🔍 Verification - Current active membership:', JSON.stringify(verifyMembership, null, 2));
      
      return res.json(newSubscription);
      
    } else {
      // No existing membership - create everything new
      console.log('🆕 Creating new membership and subscription...');
      
      // Create Stripe subscription
      const newSubscription = await stripeService.createSubscription(stripeCustomerId, stripePriceId);
      
      // Create membership in database
      await dbService.createMembership({
        user_id: userId,
        plan_type: membershipPlan.title || 'Premium',
        credits: membershipPlan.credits || 0,
        plan_id: membershipPlan.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: newSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: newSubscription.status,
        start_date: new Date(newSubscription.current_period_start * 1000).toISOString(),
        end_date: new Date(newSubscription.current_period_end * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ New membership and subscription created');
      return res.json(newSubscription);
    }

  } catch (error: any) {
    console.error('❌ Subscription management error:', error);
    res.status(500).json({ error: error.message || 'Subscription management failed' });
  }
});

// LEGACY ENDPOINT - Keep for backward compatibility
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { userId, stripePriceId, customerId, priceId, membershipPlanId } = req.body;
    
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
    const unifiedReq = { ...req, body: { userId: finalUserId, stripePriceId: finalStripePriceId } };
    
    // Forward to unified handler (we'll implement this logic directly here for simplicity)
    console.log('🔄 Legacy endpoint redirecting to unified logic');
    
    if (!finalUserId || !finalStripePriceId) {
      return res.status(400).json({ error: 'User ID and Stripe price ID are required' });
    }

    // Get membership plan
    const membershipPlan = await dbService.getMembershipPlanByStripePrice(finalStripePriceId);
    if (!membershipPlan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    // Get user profile
    const userProfile = await dbService.getUserProfile(finalUserId);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get or create Stripe customer
    const stripeCustomerId = customerId || await stripeService.createOrGetCustomer(
      userProfile.email || `user+${finalUserId}@fitpass.com`,
      userProfile.display_name || userProfile.full_name || 'FitPass User',
      finalUserId
    );

    // Create Stripe subscription
    const stripeSubscription = await stripeService.createSubscription(stripeCustomerId, finalStripePriceId);

    // Handle membership creation/update
    const existingMembership = await dbService.getUserActiveMembership(finalUserId);
    
    if (existingMembership) {
      await dbService.updateMembership(existingMembership.id, {
        plan_id: membershipPlan.id,
        plan_type: membershipPlan.title,
        credits: membershipPlan.credits,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: stripeSubscription.status,
        start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      await dbService.createMembership({
        user_id: finalUserId,
        plan_type: membershipPlan.title || 'Premium',
        credits: membershipPlan.credits || 0,
        plan_id: membershipPlan.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: membershipPlan.stripe_price_id,
        stripe_status: stripeSubscription.status,
        start_date: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        end_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    res.json(stripeSubscription);
  } catch (error: any) {
    console.error('Error in legacy create-subscription:', error);
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

// Complete subscription payment for testing
router.post('/complete-payment/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    console.log('🧪 Completing payment for subscription:', subscriptionId);
    const result = await stripeService.completeSubscriptionPayment(subscriptionId);
    
    if (result.success) {
      // After completing payment, sync the subscription status from Stripe
      console.log('🔄 Syncing subscription status after payment completion...');
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update database with current Stripe status
        const { data: membership, error } = await supabase
          .from('memberships')
          .update({ 
            stripe_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating membership status:', error);
        } else {
          console.log('✅ Membership status updated:', membership?.stripe_status);
        }
      } catch (syncError) {
        console.error('⚠️ Error syncing subscription status:', syncError);
      }
      
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    console.error('Error completing payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all incomplete subscriptions for testing
router.get('/incomplete-subscriptions', async (req: Request, res: Response) => {
  try {
    console.log('📋 Getting all incomplete subscriptions...');
    
    // Get all active memberships with incomplete stripe status
    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('is_active', true)
      .eq('stripe_status', 'incomplete');

    if (error) throw error;

    res.json({ data: memberships || [] });
  } catch (error: any) {
    console.error('Error getting incomplete subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comprehensive sync of all subscriptions from Stripe
router.post('/sync-all-subscriptions', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting comprehensive subscription sync from Stripe...');
    
    const result = await stripeService.syncSubscriptionsFromStripe();
    
    res.json({
      success: true,
      message: `Sync completed: ${result.created} created, ${result.updated} updated`,
      data: result
    });
  } catch (error: any) {
    console.error('Error syncing subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to sync subscriptions from Stripe'
    });
  }
});

export default router;
