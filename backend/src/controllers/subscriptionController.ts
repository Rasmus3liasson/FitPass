import { Request, Response } from 'express';
import { dbService, supabase } from '../services/database';
import { stripe, stripeService } from '../services/stripe';
import { CancelSubscriptionRequest, CreateSubscriptionRequest } from '../types/api';
import { calculateDaysUntilRenewal, formatDate } from '../utils/helpers';
import { handleControllerError, sendErrorResponse, sendSuccessResponse } from '../utils/response';

export class SubscriptionController {
  async manageSubscription(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 /manage-subscription endpoint called with:', req.body);
      const { userId, stripePriceId }: CreateSubscriptionRequest = req.body;

      console.log('🚀 ===== MANAGE SUBSCRIPTION START =====');
      console.log('📝 Request:', { userId, stripePriceId });

      // 1. Get membership plan
      const membershipPlan = await dbService.getMembershipPlanByStripePrice(stripePriceId);
      if (!membershipPlan) {
        sendErrorResponse(res, 'Membership plan not found', undefined, 404);
        return;
      }
      console.log('✅ Plan found:', membershipPlan.title);

      // 2. Get user profile
      const userProfile = await dbService.getUserProfile(userId);
      if (!userProfile) {
        sendErrorResponse(res, 'User profile not found', undefined, 404);
        return;
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
        if (
          existingMembership.plan_id === membershipPlan.id &&
          existingMembership.stripe_subscription_id
        ) {
          console.log('✅ User already has this plan');
          sendSuccessResponse(res, {
            subscription_id: existingMembership.stripe_subscription_id,
            status: existingMembership.stripe_status || 'active',
            message: 'User already has this plan',
          });
          return;
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
              start_date: formatDate(updatedSubscription.current_period_start),
              end_date: formatDate(updatedSubscription.current_period_end),
              updated_at: new Date().toISOString(),
            });

            console.log('✅ Subscription updated successfully');
            sendSuccessResponse(res, updatedSubscription);
            return;
          } catch (updateError: any) {
            console.log('⚠️ Update failed, creating new subscription:', updateError.message);
          }
        }

        // Create new subscription and update existing membership
        console.log('🆕 Creating new subscription for existing membership...');
        const newSubscription = await stripeService.createSubscription(
          stripeCustomerId,
          stripePriceId
        );

        const updatedMembership = await dbService.updateMembership(existingMembership.id, {
          plan_id: membershipPlan.id,
          plan_type: membershipPlan.title,
          credits: membershipPlan.credits,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: newSubscription.id,
          stripe_price_id: membershipPlan.stripe_price_id,
          stripe_status: newSubscription.status,
          start_date: formatDate(newSubscription.current_period_start),
          end_date: formatDate(newSubscription.current_period_end),
          updated_at: new Date().toISOString(),
        });

        console.log('✅ Existing membership updated with new subscription');
        sendSuccessResponse(res, newSubscription);
      } else {
        // No existing membership - create everything new
        console.log('🆕 Creating new membership and subscription...');

        // Create Stripe subscription
        const newSubscription = await stripeService.createSubscription(
          stripeCustomerId,
          stripePriceId
        );

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
          start_date: formatDate(newSubscription.current_period_start),
          end_date: formatDate(newSubscription.current_period_end),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        console.log('✅ New membership and subscription created');
        sendSuccessResponse(res, newSubscription);
      }
    } catch (error: any) {
      handleControllerError(res, error, 'Manage subscription');
    }
  }

  async getUserSubscription(req: Request, res: Response): Promise<void> {
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
        sendSuccessResponse(res, { subscription: null });
        return;
      }

      if (!membership.stripe_subscription_id) {
        console.log('❌ No Stripe subscription ID found');
        sendSuccessResponse(res, { subscription: null });
        return;
      }

      // Get subscription from Stripe
      const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
      const product = await stripe.products.retrieve(
        subscription.items.data[0].price.product as string
      );

      const subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        plan_name: product.name,
        amount: subscription.items.data[0].price.unit_amount || 0,
        currency: subscription.currency,
        interval: subscription.items.data[0].price.recurring?.interval || 'month',
        current_period_start: formatDate(subscription.current_period_start),
        current_period_end: formatDate(subscription.current_period_end),
        cancel_at_period_end: subscription.cancel_at_period_end,
        next_billing_date: subscription.cancel_at_period_end
          ? null
          : formatDate(subscription.current_period_end),
        days_until_renewal: subscription.cancel_at_period_end
          ? null
          : calculateDaysUntilRenewal(subscription.current_period_end),
      };

      console.log('✅ Successfully retrieved subscription');
      sendSuccessResponse(res, { subscription: subscriptionData });
    } catch (error: any) {
      handleControllerError(res, error, 'Get user subscription');
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason }: CancelSubscriptionRequest = req.body;
      console.log(`🔍 Canceling subscription for user: ${userId}, reason: ${reason}`);

      // Get user's membership from database
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !membership?.stripe_subscription_id) {
        sendErrorResponse(res, 'No active subscription found', undefined, 404);
        return;
      }

      // Cancel subscription at period end
      const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || 'User requested cancellation',
        },
      });

      console.log('✅ Successfully canceled subscription at period end');
      sendSuccessResponse(res, {
        message: `Din prenumeration kommer att avslutas ${new Date(subscription.current_period_end * 1000).toLocaleDateString('sv-SE')}`,
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Cancel subscription');
    }
  }

  async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      console.log(`🔍 Reactivating subscription for user: ${userId}`);

      // Get user's membership from database
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !membership?.stripe_subscription_id) {
        sendErrorResponse(res, 'No subscription found', undefined, 404);
        return;
      }

      // Reactivate subscription
      const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      console.log('✅ Successfully reactivated subscription');
      sendSuccessResponse(res, {
        message: 'Din prenumeration har återaktiverats och kommer att förnyas automatiskt',
      });
    } catch (error: any) {
      handleControllerError(res, error, 'Reactivate subscription');
    }
  }
}

export const subscriptionController = new SubscriptionController();
