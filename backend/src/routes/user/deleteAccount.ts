import { Router } from 'express';
import { supabase } from '../../services/database';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/response';

const router: Router = Router();

router.delete('/:userId/delete-account', async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmEmail } = req.body;

    if (!userId) {
      return sendErrorResponse(res, 'User ID is required', undefined, 400);
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return sendErrorResponse(res, 'User not found', undefined, 404);
    }

    if (confirmEmail && userProfile.email !== confirmEmail) {
      return sendErrorResponse(res, 'Email confirmation does not match', undefined, 403);
    }

    const { data: memberships } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('user_id', userId);

    if (memberships && memberships.length > 0) {
      const stripe = (await import('stripe')).default;
      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });

      for (const membership of memberships) {
        if (membership.stripe_subscription_id) {
          try {
            await stripeInstance.subscriptions.cancel(membership.stripe_subscription_id);
          } catch (error) {
            console.error('Error cancelling subscription:', error);
          }
        }
      }
    }

    const stripeCustomerId = userProfile.stripe_customer_id;
    if (stripeCustomerId) {
      try {
        const stripe = (await import('stripe')).default;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2023-10-16',
        });

        const paymentMethods = await stripeInstance.paymentMethods.list({
          customer: stripeCustomerId,
          limit: 100,
        });

        for (const pm of paymentMethods.data) {
          await stripeInstance.paymentMethods.detach(pm.id);
        }

        await stripeInstance.customers.del(stripeCustomerId);
      } catch (error) {
        console.error('Error deleting Stripe customer:', error);
      }
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return sendErrorResponse(
        res,
        'Misslyckades med att radera användare',
        deleteAuthError.message
      );
    }

    sendSuccessResponse(
      res,
      { deleted: true },
      'Kontothar raderats och relaterade data har tagits bort.'
    );
  } catch (error: any) {
    console.error('Delete account error:', error);
    sendErrorResponse(
      res,
      error.message || 'Ett fel uppstod vid radering av kontot',
      'Misslyckades med att radera konto'
    );
  }
});

export default router;
