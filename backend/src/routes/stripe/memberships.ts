import { Request, Response, Router } from 'express';
import { dbService, supabase } from '../../services/database';

const router: Router = Router() as Router;

// Get membership plans
router.get('/membership-plans', async (req: Request, res: Response) => {
  try {
    const { data: plans, error } = await supabase
      .from('membership_plans')
      .select('*')
      .order('price');

    if (error) throw error;

    res.json({ success: true, plans });
  } catch (error: any) {
    console.error('Error getting membership plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user membership
router.get('/user/:userId/membership', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const membership = await dbService.getUserActiveMembership(userId);

    if (!membership) {
      return res.json({
        success: true,
        membership: null,
        message: 'No active membership found',
      });
    }

    // Get additional membership plan details
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', membership.plan_id)
      .single();

    if (planError) {
      console.warn('Could not fetch plan details:', planError);
    }

    res.json({
      success: true,
      membership: {
        ...membership,
        plan: plan || null,
      },
    });
  } catch (error: any) {
    console.error('Error getting user membership:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create test membership
router.post('/create-test-membership', async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({
        error: 'User ID and plan ID are required',
      });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        error: 'Membership plan not found',
      });
    }

    // Deactivate any existing memberships for this user
    await dbService.deactivateUserMemberships(userId);

    // Create new test membership
    const membership = await dbService.createMembership({
      user_id: userId,
      plan_id: planId,
      plan_type: plan.title,
      credits: plan.credits,
      credits_used: 0,
      stripe_customer_id: undefined,
      stripe_subscription_id: undefined,
      stripe_price_id: plan.stripe_price_id,
      stripe_status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      is_active: true,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      membership,
      message: 'Test membership created successfully',
    });
  } catch (error: any) {
    console.error('Error creating test membership:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update membership credits
router.post('/update-membership-credits', async (req: Request, res: Response) => {
  try {
    const { userId, creditsUsed } = req.body;

    if (!userId || creditsUsed === undefined) {
      return res.status(400).json({
        error: 'User ID and credits used are required',
      });
    }

    // Get current membership
    const membership = await dbService.getUserActiveMembership(userId);

    if (!membership) {
      return res.status(404).json({
        error: 'No active membership found for user',
      });
    }

    // Update credits
    const newCreditsUsed = membership.credits_used + creditsUsed;
    const remainingCredits = Math.max(0, membership.credits - newCreditsUsed);

    await dbService.updateMembership(membership.id, {
      credits_used: newCreditsUsed,
      updated_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      membership: {
        ...membership,
        credits_used: newCreditsUsed,
        remaining_credits: remainingCredits,
      },
      message: 'Membership credits updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating membership credits:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
